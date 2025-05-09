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

const batchPublishMessages = async (
	topicArn: string,
	messages: Message[],
): Promise<{ messagesSent: number; failedMessages: string[] }> => {
	const snsClient = new SNSClient({ region: process.env["AWS_REGION"] ?? "" });
	const groupsOfTenMessages = [
		...Array(Math.ceil(messages.length / 10)).keys(),
	].map((tenthIndex) => messages.slice(tenthIndex * 10, tenthIndex * 10 + 10));

	const responses = await Promise.all(
		groupsOfTenMessages.map(async (groupOfTenMessages) => {
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
			response.Failed
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
