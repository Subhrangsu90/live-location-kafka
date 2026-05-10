const socket = io();
const map = L.map("map").setView([51.505, -0.09], 13);
const remoteMarkers = new Map();
let myCurrentLocationMarker = null;

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
	maxZoom: 19,
	attribution:
		'&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

socket.on("server:location:update", (data) => {
	const { id, latitude, longitude } = data;

	if (!remoteMarkers.has(id)) {
		const marker = L.marker([latitude, longitude]);
		marker.addTo(map).bindPopup(id).openPopup();
		remoteMarkers.set(id, marker);
		return;
	}

	const existingMarker = remoteMarkers.get(id);
	existingMarker.setLatLng([latitude, longitude]);
});

function getUserCurrentLocation() {
	return new Promise((resolve, reject) => {
		if (!("geolocation" in navigator)) {
			reject(new Error("Geolocation is not supported by this browser."));
			return;
		}

		navigator.geolocation.getCurrentPosition(
			(position) => {
				resolve({
					latitude: position.coords.latitude,
					longitude: position.coords.longitude,
				});
			},
			reject,
			{ enableHighAccuracy: true },
		);
	});
}

function updateMyLocationMarker(latitude, longitude) {
	if (!myCurrentLocationMarker) {
		myCurrentLocationMarker = L.marker([latitude, longitude])
			.addTo(map)
			.bindPopup("You are here!")
			.openPopup();
		return;
	}

	myCurrentLocationMarker.setLatLng([latitude, longitude]);
}

async function publishCurrentLocation() {
	const { latitude, longitude } = await getUserCurrentLocation();

	socket.emit("client:location:update", {
		latitude,
		longitude,
	});

	updateMyLocationMarker(latitude, longitude);
}

async function main() {
	await publishCurrentLocation();
	setInterval(publishCurrentLocation, 10 * 1000);
}

window.addEventListener("load", () => {
	main().catch((error) => {
		console.error("Unable to start location tracker", error);
	});
});
