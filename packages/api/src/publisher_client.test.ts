import {
	PublishBatchCommand,
	SNSClient,
	type PublishBatchInput,
} from "@aws-sdk/client-sns";
import { publisherClient } from "./publisher_client";

const mockSend = jest.fn();
jest.createMockFromModule("@aws-sdk/client-sns");
jest.mock("@aws-sdk/client-sns");

describe("batchPublishMessages", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});
	test("should publish messages in batches", async () => {
		jest.mocked(SNSClient).mockImplementation(
			jest.fn().mockReturnValue({
				send: mockSend.mockResolvedValue({ Failed: [] }),
			}),
		);

		jest.mocked(PublishBatchCommand).mockImplementation(
			jest.fn().mockImplementation((input: PublishBatchInput) => ({
				__input: input,
			})),
		);

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
			{ id: "12", body: "message 12" },
			{ id: "13", body: "message 13" },
			{ id: "14", body: "message 14" },
			{ id: "15", body: "message 15" },
			{ id: "16", body: "message 16" },
			{ id: "17", body: "message 17" },
			{ id: "18", body: "message 18" },
			{ id: "19", body: "message 19" },
			{ id: "20", body: "message 20" },
			{ id: "21", body: "message 21" },
		];

		const result = await publisherClient.batchPublishMessages(
			"topic",
			messages,
		);

		expect(mockSend).toHaveBeenCalledTimes(3);
		const {
			mock: {
				calls: [firstCallArguments],
			},
		} = mockSend as {
			mock: { calls: Array<Array<{ __input: PublishBatchInput }>> };
		};
		const {
			mock: {
				calls: [, secondCallArguments],
			},
		} = mockSend as {
			mock: { calls: Array<Array<{ __input: PublishBatchInput }>> };
		};
		const {
			mock: {
				calls: [, , thirdCallArguments],
			},
		} = mockSend as {
			mock: { calls: Array<Array<{ __input: PublishBatchInput }>> };
		};
		expect(firstCallArguments).toBeDefined();
		if (firstCallArguments !== undefined) {
			expect(firstCallArguments[0]).toBeDefined();
			if (firstCallArguments[0] !== undefined) {
				expect(firstCallArguments[0].__input).toEqual({
					TopicArn: "topic",
					PublishBatchRequestEntries: [
						{ Id: "1", Message: "message 1" },
						{ Id: "2", Message: "message 2" },
						{ Id: "3", Message: "message 3" },
						{ Id: "4", Message: "message 4" },
						{ Id: "5", Message: "message 5" },
						{ Id: "6", Message: "message 6" },
						{ Id: "7", Message: "message 7" },
						{ Id: "8", Message: "message 8" },
						{ Id: "9", Message: "message 9" },
						{ Id: "10", Message: "message 10" },
					],
				});
			}
		}
		expect(secondCallArguments).toBeDefined();
		if (secondCallArguments !== undefined) {
			expect(secondCallArguments[0]).toBeDefined();
			if (secondCallArguments[0] !== undefined) {
				expect(secondCallArguments[0].__input).toEqual({
					TopicArn: "topic",
					PublishBatchRequestEntries: [
						{ Id: "11", Message: "message 11" },
						{ Id: "12", Message: "message 12" },
						{ Id: "13", Message: "message 13" },
						{ Id: "14", Message: "message 14" },
						{ Id: "15", Message: "message 15" },
						{ Id: "16", Message: "message 16" },
						{ Id: "17", Message: "message 17" },
						{ Id: "18", Message: "message 18" },
						{ Id: "19", Message: "message 19" },
						{ Id: "20", Message: "message 20" },
					],
				});
			}
		}
		expect(thirdCallArguments).toBeDefined();
		if (thirdCallArguments !== undefined) {
			expect(thirdCallArguments[0]).toBeDefined();
			if (thirdCallArguments[0] !== undefined) {
				expect(thirdCallArguments[0].__input).toEqual({
					TopicArn: "topic",
					PublishBatchRequestEntries: [{ Id: "21", Message: "message 21" }],
				});
			}
		}
		expect(result.failedMessages.length).toBe(0);
		expect(result.messagesSent).toBe(21);
	});

	test("should report failures", async () => {
		jest.mocked(SNSClient).mockImplementation(
			jest.fn().mockReturnValue({
				send: mockSend.mockResolvedValue({ Failed: [{ Id: "1" }] }),
			}),
		);

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
			messages,
		);

		expect(mockSend).toHaveBeenCalledTimes(1);
		expect(result.failedMessages.length).toBe(1);
		expect(result.messagesSent).toBe(9);
	});

	test("should construct SNS Client with endpoint when AWS_ENDPOINT_URL is set", async () => {
		const {
			env: { AWS_ENDPOINT_URL: originalEndpoint },
		} = process;
		process.env["AWS_ENDPOINT_URL"] = "http://localhost:4566";

		const mockSNSClient = jest.fn().mockReturnValue({
			send: mockSend.mockResolvedValue({ Failed: [] }),
		});
		jest.mocked(SNSClient).mockImplementation(mockSNSClient);

		const messages = [{ id: "1", body: "message 1" }];

		await publisherClient.batchPublishMessages("topic", messages);

		expect(mockSNSClient).toHaveBeenCalledWith({
			region: process.env["AWS_REGION"] ?? "",
			endpoint: "http://localhost:4566",
		});

		if (originalEndpoint === undefined) {
			delete process.env["AWS_ENDPOINT_URL"];
		} else {
			process.env["AWS_ENDPOINT_URL"] = originalEndpoint;
		}
	});
});

describe("publishMessage", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	test("should publish a message", async () => {
		jest.mocked(SNSClient).mockImplementation(
			jest.fn().mockReturnValue({
				send: mockSend.mockResolvedValue({ Failed: [] }),
			}),
		);

		await publisherClient.publishMessage("topic", { id: "1", body: "message" });
		expect(mockSend).toHaveBeenCalledTimes(1);
	});

	test("should include message attributes if provided", async () => {
		jest.mocked(SNSClient).mockImplementation(
			jest.fn().mockReturnValue({
				send: mockSend.mockResolvedValue({ Failed: [] }),
			}),
		);

		await publisherClient.publishMessage("topic", {
			id: "1",
			body: "message",
			attributes: {
				Entity: "account",
				Action: "login",
			},
		});
		const {
			mock: {
				calls: [publishCommand],
			},
		} = mockSend as { mock: { calls: PublishBatchCommand[] } };
		expect(publishCommand).toBeDefined();
		if (publishCommand !== undefined) {
			expect(publishCommand.input).toEqual(
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
				}).input,
			);
		}
	});

	test("should throw an error if the message fails to publish", async () => {
		jest.mocked(SNSClient).mockImplementation(
			jest.fn().mockReturnValue({
				send: mockSend.mockResolvedValue({ Failed: [{ Id: "1" }] }),
			}),
		);

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
