import http from "node:http";
import path from "node:path";

import express from "express";
import { Server } from "socket.io";

import authRoutes from "./src/app/auth/auth.routes.js";
import {
	createLocationConsumer,
	createLocationProducer,
} from "./src/app/location/location.service.js";
import {
	registerLocationSocketHandlers,
	startLocationBroadcasts,
} from "./src/app/location/location.socket.js";

async function main() {
	const PORT = process.env.PORT ?? 8000;

	const app = express();
	const server = http.createServer(app);

	const io = new Server();

	const kafkaProducer = createLocationProducer();
	await kafkaProducer.connect();

	const kafkaConsumer = createLocationConsumer(`socket-server-${PORT}`);
	await kafkaConsumer.connect();

	await startLocationBroadcasts(io, kafkaConsumer);

	io.attach(server);
	registerLocationSocketHandlers(io, kafkaProducer);

	app.get("/health", (req, res) => {
		return res.json({
			healthy: true,
		});
	});

	app.use("/auth", authRoutes);
	app.use(express.static(path.resolve("./public")));

	server.listen(PORT, () => {
		console.log(`Server is running on port ${PORT}`);
	});
}

main();
