import {
	SNSClient,
	PublishBatchCommand,
	type BatchResultErrorEntry,
	type PublishBatchRequestEntry,
} from "@aws-sdk/client-sns";

export const lowPriorityTopicArn = process.env["LOW_PRIORITY_TOPIC_ARN"] ?? "";

export interface Message {
	id: string;
	body: string;
	attributes?: Record<string, string>;
}

const MAX_MESSAGES_PER_BATCH = 10;
const MAX_BATCH_SIZE_IN_BYTES = 262_144;
const ATTRIBUTE_DATA_TYPE = "String";

const getMessageSizeInBytes = (message: Message): number =>
	Buffer.byteLength(message.body) +
	Object.entries(message.attributes ?? {}).reduce(
		(total, [key, value]) =>
			total +
			Buffer.byteLength(key) +
			Buffer.byteLength(ATTRIBUTE_DATA_TYPE) +
			Buffer.byteLength(value),
		0,
	);

const groupMessagesIntoBatches = (
	messages: Message[],
): { batches: Message[][]; oversizedMessages: Message[] } => {
	const batches: Message[][] = [];
	const oversizedMessages: Message[] = [];
	let currentBatch: Message[] = [];
	let currentBatchSize = 0;
	for (const message of messages) {
		const messageSize = getMessageSizeInBytes(message);
		if (messageSize > MAX_BATCH_SIZE_IN_BYTES) {
			oversizedMessages.push(message);
		} else {
			if (
				currentBatch.length === MAX_MESSAGES_PER_BATCH ||
				currentBatchSize + messageSize > MAX_BATCH_SIZE_IN_BYTES
			) {
				batches.push(currentBatch);
				currentBatch = [];
				currentBatchSize = 0;
			}
			currentBatch.push(message);
			currentBatchSize += messageSize;
		}
	}
	if (currentBatch.length > 0) {
		batches.push(currentBatch);
	}
	return { batches, oversizedMessages };
};

const batchPublishMessages = async (
	topicArn: string,
	messages: Message[],
): Promise<{ messagesSent: number; failedMessages: string[] }> => {
	const snsClient = new SNSClient({
		region: process.env["AWS_REGION"] ?? "",
		...(process.env["AWS_ENDPOINT_URL"] === undefined
			? {}
			: {
					endpoint: process.env["AWS_ENDPOINT_URL"],
				}),
	});
	// Messages too large to ever be accepted by SNS are reported as failed
	// rather than sent, so they don't cause the whole request to be rejected.
	const { batches: chunksOfMessages, oversizedMessages } =
		groupMessagesIntoBatches(messages);

	const results = await Promise.allSettled(
		chunksOfMessages.map(async (groupOfMessages) => {
			const command = new PublishBatchCommand({
				TopicArn: topicArn,
				PublishBatchRequestEntries: groupOfMessages.map((message) => {
					const entry: PublishBatchRequestEntry = {
						Id: message.id,
						Message: message.body,
					};
					if (message.attributes !== undefined) {
						entry.MessageAttributes = Object.fromEntries(
							Object.entries(message.attributes).map(([key, value]) => [
								key,
								{ DataType: ATTRIBUTE_DATA_TYPE, StringValue: value },
							]),
						);
					}
					return entry;
				}),
			});

			const response = await snsClient.send(command);
			return response;
		}),
	);

	const failedMessageIds = [
		...oversizedMessages.map((message) => message.id),
		...results.flatMap((result, index) => {
			if (result.status === "rejected") {
				return (chunksOfMessages[index] ?? []).map((message) => message.id);
			}
			return result.value.Failed === undefined
				? []
				: result.value.Failed.map(
						(failed: BatchResultErrorEntry) => failed.Id ?? "",
					).filter((id: string) => id !== "");
		}),
	];

	return {
		messagesSent: messages.length - failedMessageIds.length,
		failedMessages: failedMessageIds,
	};
};

const publishMessage = async (
	topicArn: string,
	message: Message,
): Promise<void> => {
	const result = await batchPublishMessages(topicArn, [message]);
	if (result.failedMessages.length !== 0) {
		throw new Error(`Failed to send message ${JSON.stringify(message)}`);
	}
};

export const publisherClient = {
	batchPublishMessages,
	publishMessage,
};
