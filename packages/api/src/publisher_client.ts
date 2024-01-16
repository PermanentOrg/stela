import {
  SNSClient,
  PublishBatchCommand,
  type BatchResultErrorEntry,
} from "@aws-sdk/client-sns";

export const lowPriorityTopicArn = process.env["LOW_PRIORITY_TOPIC_ARN"] ?? "";

export interface Message {
  id: string;
  body: string;
}

const batchPublishMessages = async (
  topicArn: string,
  messages: Message[]
): Promise<{ messagesSent: number; failedMessages: string[] }> => {
  const snsClient = new SNSClient({ region: process.env["AWS_REGION"] ?? "" });
  const groupsOfTenMessages = [
    ...Array(Math.ceil(messages.length / 10)).keys(),
  ].map((tenthIndex) => messages.slice(tenthIndex * 10, tenthIndex * 10 + 10));

  const responses = await Promise.all(
    groupsOfTenMessages.map(async (groupOfTenMessages) => {
      const command = new PublishBatchCommand({
        TopicArn: topicArn,
        PublishBatchRequestEntries: groupOfTenMessages.map((message) => ({
          Id: message.id,
          Message: message.body,
        })),
      });

      const response = await snsClient.send(command);
      return response;
    })
  );

  const failedMessageIds = responses
    .map((response) =>
      response.Failed
        ? response.Failed.map(
            (failed: BatchResultErrorEntry) => failed.Id ?? ""
          ).filter((id: string) => id !== "")
        : []
    )
    .flat();

  return {
    messagesSent: messages.length - failedMessageIds.length,
    failedMessages: failedMessageIds,
  };
};

export const publisherClient = {
  batchPublishMessages,
};
