import { kafkaClient } from "./kafka-client.js";
import { LOCATION_TOPIC } from "./src/app/location/location.constants.js";

async function setupKafka() {
	const admin = kafkaClient.admin();

	console.log(`Kafka Admin Connecting...`);
	await admin.connect();
	console.log(`Kafka Admin Connected`);

	await admin.createTopics({
		topics: [{ topic: LOCATION_TOPIC, numPartitions: 2 }],
	});

	await admin.disconnect();
}

setupKafka();
