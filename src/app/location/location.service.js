import { kafkaClient } from "../../../kafka-client.js";
import { LOCATION_TOPIC } from "./location.constants.js";

function createLocationProducer() {
	return kafkaClient.producer();
}

function createLocationConsumer(groupId) {
	return kafkaClient.consumer({ groupId });
}

function normalizeLocationUpdate(id, locationData) {
	const latitude = Number(locationData?.latitude);
	const longitude = Number(locationData?.longitude);

	if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
		throw new Error("Location update requires latitude and longitude.");
	}

	return { id, latitude, longitude };
}

async function publishLocationUpdate(producer, locationUpdate) {
	await producer.send({
		topic: LOCATION_TOPIC,
		messages: [
			{
				key: locationUpdate.id,
				value: JSON.stringify(locationUpdate),
			},
		],
	});
}

async function subscribeToLocationUpdates(consumer, onLocationUpdate) {
	await consumer.subscribe({
		topic: LOCATION_TOPIC,
		fromBeginning: true,
	});

	await consumer.run({
		eachMessage: async ({ message, heartbeat }) => {
			const locationUpdate = JSON.parse(message.value.toString());
			await onLocationUpdate(locationUpdate);
			await heartbeat();
		},
	});
}

export {
	createLocationConsumer,
	createLocationProducer,
	normalizeLocationUpdate,
	publishLocationUpdate,
	subscribeToLocationUpdates,
};
