import http from "node:http";
import path from "node:path";

import express from "express";
import { Server } from "socket.io";

import { kafkaClient } from "./kafka-client.js";

async function main() {
	const PORT = process.env.PORT ?? 8000;

	const app = express();
	const server = http.createServer(app);

	const io = new Server();

	const kafkaProducer = kafkaClient.producer();
	await kafkaProducer.connect();

	const kafkaConsumer = kafkaClient.consumer({
		groupId: `socket-server-${PORT}`,
	});
	await kafkaConsumer.connect();

	await kafkaConsumer.subscribe({
		topic: "location-updates",
		fromBeginning: true,
	});

	await kafkaConsumer.run({
		eachMessage: async ({ topic, partition, message, heartbeat }) => {
			const data = JSON.parse(message.value.toString());
			console.log(`KafkaConsumer Data Recived`, { data });
			io.emit("server:location:update", {
				id: data.id,
				latitude: data.latitude,
				longitude: data.longitude,
			});
			await heartbeat();
		},
	});

	io.attach(server);

	io.on("connection", (socket) => {
		console.log(`[Socket: ${socket.id}: Connected Successfully]`);

		socket.on("client:location:update", async (locationData) => {
			console.log(locationData);
			const { latitude, longitude } = locationData;
			console.log(
				`[Socket: ${socket.id}: Location Updated: ${latitude}, ${longitude}]`,
			);

			await kafkaProducer.send({
				topic: "location-updates",
				messages: [
					{
						key: socket.id,
						value: JSON.stringify({
							id: socket.id,
							latitude,
							longitude,
						}),
					},
				],
			});
		});
	});

	app.get("/health", (req, res) => {
		return res.json({
			healthy: true,
		});
	});

	app.use(express.static(path.resolve("./public")));

	server.listen(PORT, () => {
		console.log(`Server is running on port ${PORT}`);
	});
}

main();
