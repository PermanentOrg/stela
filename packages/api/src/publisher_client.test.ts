import { PublishBatchCommand, SNSClient } from "@aws-sdk/client-sns";
import { publisherClient } from "./publisher_client";

const mockSend = jest.fn();
jest.genMockFromModule("@aws-sdk/client-sns");
jest.mock("@aws-sdk/client-sns");

describe("batchPublishMessages", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test("should publish messages in batches", async () => {
    (SNSClient as jest.Mock).mockImplementation(() => ({
      send: mockSend.mockResolvedValue({ Failed: [] }),
    }));
    const messages = [
      { id: "1", body: "message 1" },
      { id: "2", body: "message 2" },
      { id: "3", body: "message 3" },
      { id: "4", body: "message 4" },
      { id: "5", body: "message 5" },
      { id: "6", body: "message 6" },
      { id: "7", body: "message 7" },
      { id: "8", body: "message 8" },
      { id: "9", body: "message 9" },
      { id: "10", body: "message 10" },
      { id: "11", body: "message 11" },
    ];

    const result = await publisherClient.batchPublishMessages(
      "topic",
      messages
    );

    expect(mockSend).toHaveBeenCalledTimes(2);
    expect(result.failedMessages.length).toBe(0);
    expect(result.messagesSent).toBe(11);
  });

  test("should report failures", async () => {
    (SNSClient as jest.Mock).mockImplementation(() => ({
      send: mockSend.mockResolvedValue({ Failed: [{ Id: "1" }] }),
    }));

    const messages = [
      { id: "1", body: "message 1" },
      { id: "2", body: "message 2" },
      { id: "3", body: "message 3" },
      { id: "4", body: "message 4" },
      { id: "5", body: "message 5" },
      { id: "6", body: "message 6" },
      { id: "7", body: "message 7" },
      { id: "8", body: "message 8" },
      { id: "9", body: "message 9" },
      { id: "10", body: "message 10" },
    ];

    const result = await publisherClient.batchPublishMessages(
      "topic",
      messages
    );

    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(result.failedMessages.length).toBe(1);
    expect(result.messagesSent).toBe(9);
  });
});

describe("publishMessage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should publish a message", async () => {
    (SNSClient as jest.Mock).mockImplementation(() => ({
      send: mockSend.mockResolvedValue({ Failed: [] }),
    }));

    await publisherClient.publishMessage("topic", { id: "1", body: "message" });
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  test("should include message attributes if provided", async () => {
    (SNSClient as jest.Mock).mockImplementation(() => ({
      send: mockSend.mockResolvedValue({ Failed: [] }),
    }));

    await publisherClient.publishMessage("topic", {
      id: "1",
      body: "message",
      attributes: {
        Entity: "account",
        Action: "login",
      },
    });
    expect(
      (
        (
          (mockSend.mock.calls as unknown[])[0] as unknown[]
        )[0] as PublishBatchCommand
      ).input
    ).toEqual(
      new PublishBatchCommand({
        TopicArn: "topic",
        PublishBatchRequestEntries: [
          {
            Id: "1",
            Message: "message",
            MessageAttributes: {
              Entity: {
                DataType: "String",
                StringValue: "account",
              },
              Action: {
                DataType: "String",
                StringValue: "login",
              },
            },
          },
        ],
      }).input
    );
  });

  test("should throw an error if the message fails to publish", async () => {
    (SNSClient as jest.Mock).mockImplementation(() => ({
      send: mockSend.mockResolvedValue({ Failed: [{ Id: "1" }] }),
    }));

    let error = null;
    try {
      await publisherClient.publishMessage("topic", {
        id: "1",
        body: "message",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(error).not.toBeNull();
    }
  });
});
