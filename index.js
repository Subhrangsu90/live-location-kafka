import http from "node:http";
import path from "node:path";

import express from "express";
import { Server } from "socket.io";

async function main() {
	const PORT = process.env.PORT ?? 8000;

	const app = express();
	const server = http.createServer(app);

	const io = new Server();

	io.attach(server);

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
