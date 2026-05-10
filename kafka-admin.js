import { kafkaClient } from "./kafka-client.js";

async function setupKafka() {
	const admin = kafkaClient.admin();

	console.log(`Kafka Admin Connecting...`);
	await admin.connect();
	console.log(`Kafka Admin Connected`);

	await admin.createTopics({
		topics: [{ topic: "location-update", numPartitions: 2 }],
	});

	await admin.disconnect();
}

setupKafka();
