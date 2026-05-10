import { Kafka } from "kafkajs";

export const kafkaClient = new Kafka({
	clientId: "location-tracker",
	brokers: ["kafka:9092"],
});
