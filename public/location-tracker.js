const socket = io();
const map = L.map("map").setView([51.505, -0.09], 13);
const remoteMarkers = new Map();
let myCurrentLocationMarker = null;
let currentUser = null;

const trackerStatus = document.querySelector("#trackerStatus");
const trackerDetail = document.querySelector("#trackerDetail");
const peerCount = document.querySelector("#peerCount");
const lastPing = document.querySelector("#lastPing");
const myCoordinates = document.querySelector("#myCoordinates");
const authStatus = document.querySelector("#authStatus");
const logoutButton = document.querySelector("#logoutButton");
const guestAuthControls = document.querySelectorAll(".auth-guest");
const userAuthControls = document.querySelectorAll(".auth-user");

function setAuthControls(isAuthenticated) {
	guestAuthControls.forEach((control) => {
		control.hidden = isAuthenticated;
	});

	userAuthControls.forEach((control) => {
		control.hidden = !isAuthenticated;
	});
}

async function fetchCurrentUser() {
	try {
		const response = await fetch("/auth/me");
		const data = await response.json().catch(() => ({}));

		if (!response.ok || !data.authenticated) {
			authStatus.textContent = "Guest mode";
			setAuthControls(false);
			return null;
		}

		const displayName =
			data.user?.name ||
			data.user?.email ||
			data.user?.sub ||
			"Signed in";

		authStatus.textContent = displayName;
		setAuthControls(true);

		return data.user;
	} catch (error) {
		console.error("Unable to load current user", error);
		authStatus.textContent = "Guest mode";
		setAuthControls(false);
		return null;
	}
}

async function logoutCurrentUser() {
	await fetch("/auth/logout", {
		method: "POST",
	});

	window.location.reload();
}

logoutButton.addEventListener("click", () => {
	logoutCurrentUser().catch((error) => {
		console.error("Unable to logout", error);
	});
});

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
	maxZoom: 19,
	attribution:
		'&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

socket.on("server:location:update", (data) => {
	const { id, latitude, longitude, name, sub } = data;
	const displayName = name || sub || id;

	if (!remoteMarkers.has(id)) {
		const marker = L.marker([latitude, longitude]);
		marker.addTo(map).bindPopup(displayName).openPopup();
		remoteMarkers.set(id, marker);
		peerCount.textContent = remoteMarkers.size;
		return;
	}

	const existingMarker = remoteMarkers.get(id);
	existingMarker.setLatLng([latitude, longitude]);
	existingMarker.getPopup().setContent(displayName);
	peerCount.textContent = remoteMarkers.size;
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
	const displayName = currentUser?.name || currentUser?.sub || "You are here!";

	if (!myCurrentLocationMarker) {
		myCurrentLocationMarker = L.marker([latitude, longitude])
			.addTo(map)
			.bindPopup(displayName)
			.openPopup();
		return;
	}

	myCurrentLocationMarker.setLatLng([latitude, longitude]);
	myCurrentLocationMarker.getPopup().setContent(displayName);
}

async function publishCurrentLocation() {
	trackerStatus.textContent = "Sharing live";
	trackerDetail.textContent =
		"Broadcasting your latest location every 10 seconds.";

	const { latitude, longitude } = await getUserCurrentLocation();

	socket.emit("client:location:update", {
		latitude,
		longitude,
		name: currentUser?.name || currentUser?.email || currentUser?.sub,
		sub: currentUser?.sub,
	});

	updateMyLocationMarker(latitude, longitude);
	myCoordinates.textContent = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
	lastPing.textContent = new Date().toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	});
}

async function main() {
	await publishCurrentLocation();
	setInterval(publishCurrentLocation, 10 * 1000);
}

window.addEventListener("load", async () => {
	currentUser = await fetchCurrentUser();

	// AUTH: To require login before tracking.
	if (!currentUser) {
		trackerStatus.textContent = "Login required";
		trackerDetail.textContent = "Please login before sharing location.";
		return;
	}

	main().catch((error) => {
		console.error("Unable to start location tracker", error);
		trackerStatus.textContent = "Location blocked";
		trackerDetail.textContent =
			"Enable browser location permission and refresh the page.";
	});
});
