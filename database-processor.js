import { kafkaClient } from "./kafka-client.js";

async function init(params) {
	const kafkaConsumer = kafkaClient.consumer({
		groupId: `database-processor`,
	});
	await kafkaConsumer.connect();

	await kafkaConsumer.subscribe({
		topic: "location-updates",
		fromBeginning: true,
	});

	await kafkaConsumer.run({
		eachMessage: async ({ topic, partition, message, heartbeat }) => {
			const data = JSON.parse(message.value.toString());
			console.log(`INSERT INTO DB LOCATION`, data);
			await heartbeat();
		},
	});
}

init();
