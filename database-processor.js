import {
	createLocationConsumer,
	subscribeToLocationUpdates,
} from "./src/app/location/location.service.js";

async function init() {
	const kafkaConsumer = createLocationConsumer("database-processor");
	await kafkaConsumer.connect();

	await subscribeToLocationUpdates(kafkaConsumer, async (locationUpdate) => {
		console.log("INSERT INTO DB LOCATION", locationUpdate);
	});
}

init();
