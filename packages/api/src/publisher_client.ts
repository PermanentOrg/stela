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

const CHUNK_SIZE = 10;

const batchPublishMessages = async (
	topicArn: string,
	messages: Message[],
): Promise<{ messagesSent: number; failedMessages: string[] }> => {
	const snsClient = new SNSClient({ region: process.env["AWS_REGION"] ?? "" });
	const chunksOfMessages = [
		...Array(Math.ceil(messages.length / CHUNK_SIZE)).keys(),
	].map((chunkIndex) =>
		messages.slice(chunkIndex * CHUNK_SIZE, chunkIndex++ * CHUNK_SIZE),
	);

	const responses = await Promise.all(
		chunksOfMessages.map(async (groupOfTenMessages) => {
			const command = new PublishBatchCommand({
				TopicArn: topicArn,
				PublishBatchRequestEntries: groupOfTenMessages.map((message) => {
					const entry: PublishBatchRequestEntry = {
						Id: message.id,
						Message: message.body,
					};
					if (message.attributes !== undefined) {
						entry.MessageAttributes = Object.fromEntries(
							Object.entries(message.attributes).map(([key, value]) => [
								key,
								{ DataType: "String", StringValue: value },
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

	const failedMessageIds = responses
		.map((response) =>
			response.Failed !== undefined
				? response.Failed.map(
						(failed: BatchResultErrorEntry) => failed.Id ?? "",
					).filter((id: string) => id !== "")
				: [],
		)
		.flat();

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
