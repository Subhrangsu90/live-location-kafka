import { SOCKET_EVENTS } from "./location.constants.js";
import {
	normalizeLocationUpdate,
	publishLocationUpdate,
	subscribeToLocationUpdates,
} from "./location.service.js";

async function startLocationBroadcasts(io, consumer) {
	await subscribeToLocationUpdates(consumer, async (locationUpdate) => {
		console.log("KafkaConsumer Data Received", { data: locationUpdate });
		io.emit(SOCKET_EVENTS.serverLocationUpdate, locationUpdate);
	});
}

function registerLocationSocketHandlers(io, producer) {
	io.on("connection", (socket) => {
		console.log(`[Socket: ${socket.id}: Connected Successfully]`);

		socket.on(SOCKET_EVENTS.clientLocationUpdate, async (locationData) => {
			try {
				const locationUpdate = normalizeLocationUpdate(
					socket.id,
					locationData,
				);

				console.log(
					`[Socket: ${socket.id}: Location Updated: ${locationUpdate.latitude}, ${locationUpdate.longitude}]`,
				);

				await publishLocationUpdate(producer, locationUpdate);
			} catch (error) {
				console.error(
					`[Socket: ${socket.id}: Invalid location update]`,
					error,
				);
			}
		});
	});
}

export { registerLocationSocketHandlers, startLocationBroadcasts };
