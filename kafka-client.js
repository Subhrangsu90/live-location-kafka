import { Kafka } from "kafkajs";

export const kafkaClient = new Kafka({
	clintId: "chaicode",
	brokers: ["localhost:9092"],
});
