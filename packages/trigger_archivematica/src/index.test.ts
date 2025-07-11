import type { Context } from "aws-lambda";
import { mock } from "jest-mock-extended";
import { logger } from "@stela/logger";
import { triggerArchivematicaProcessing } from "@stela/archivematica-utils";
import { db } from "./database";
import { handler, extractRecordIdFromRecordCreateMessage } from "./index";

jest.mock("./database");
jest.mock("@stela/archivematica-utils", () => ({
	triggerArchivematicaProcessing: jest.fn().mockResolvedValue({
		json: jest.fn(),
		text: jest.fn(),
		ok: true,
	}),
}));
jest.mock("@stela/logger", () => ({
	logger: {
		error: jest.fn(),
	},
}));

const loadFixtures = async (): Promise<void> => {
	await db.sql("fixtures.create_test_accounts");
	await db.sql("fixtures.create_test_archives");
	await db.sql("fixtures.create_test_records");
	await db.sql("fixtures.create_test_files");
	await db.sql("fixtures.create_test_record_files");
};

const clearDatabase = async (): Promise<void> => {
	await db.query(
		`TRUNCATE
        account,
        archive,
        record,
        file,
        record_file
      CASCADE`,
	);
};

describe("extractRecordIdFromRecordCreateMessage", () => {
	test("should extract record ID from a valid create message", () => {
		const message = {
			messageId: "1",
			receiptHandle: "1",
			body: JSON.stringify({
				Message: JSON.stringify({
					entity: "record",
					action: "create",
					body: { record: { recordId: "123" } },
				}),
			}),
			attributes: {
				ApproximateReceiveCount: "1",
				SentTimestamp: "1",
				SenderId: "1",
				ApproximateFirstReceiveTimestamp: "1",
			},
			messageAttributes: {},
			md5OfBody: "1",
			eventSource: "1",
			eventSourceARN: "1",
			awsRegion: "1",
		};

		const recordId = extractRecordIdFromRecordCreateMessage(message);
		expect(recordId).toBe("123");
	});

	test("should throw error for invalid message body", () => {
		const message = {
			messageId: "1",
			receiptHandle: "1",
			body: JSON.stringify({ invalid: "message" }),
			attributes: {
				ApproximateReceiveCount: "1",
				SentTimestamp: "1",
				SenderId: "1",
				ApproximateFirstReceiveTimestamp: "1",
			},
			messageAttributes: {},
			md5OfBody: "1",
			eventSource: "1",
			eventSourceARN: "1",
			awsRegion: "1",
		};

		expect(() => extractRecordIdFromRecordCreateMessage(message)).toThrow(
			"Invalid message body",
		);
	});

	test("should throw error for invalid message format", () => {
		const message = {
			messageId: "1",
			receiptHandle: "1",
			body: JSON.stringify({
				Message: JSON.stringify({ invalid: "format" }),
			}),
			attributes: {
				ApproximateReceiveCount: "1",
				SentTimestamp: "1",
				SenderId: "1",
				ApproximateFirstReceiveTimestamp: "1",
			},
			messageAttributes: {},
			md5OfBody: "1",
			eventSource: "1",
			eventSourceARN: "1",
			awsRegion: "1",
		};

		expect(() => extractRecordIdFromRecordCreateMessage(message)).toThrow(
			"Invalid message",
		);
	});

	test("should throw error when record field is missing", () => {
		const message = {
			messageId: "1",
			receiptHandle: "1",
			body: JSON.stringify({
				Message: JSON.stringify({
					entity: "record",
					action: "create",
					body: {},
				}),
			}),
			attributes: {
				ApproximateReceiveCount: "1",
				SentTimestamp: "1",
				SenderId: "1",
				ApproximateFirstReceiveTimestamp: "1",
			},
			messageAttributes: {},
			md5OfBody: "1",
			eventSource: "1",
			eventSourceARN: "1",
			awsRegion: "1",
		};

		expect(() => extractRecordIdFromRecordCreateMessage(message)).toThrow(
			"record field missing in body of record.create",
		);
	});
});

describe("handler", () => {
	beforeEach(async () => {
		await loadFixtures();
		jest.clearAllMocks();
	});

	afterEach(async () => {
		await clearDatabase();
	});

	test("should trigger archivematica processing for valid record", async () => {
		await handler(
			{
				Records: [
					{
						messageId: "1",
						receiptHandle: "1",
						body: JSON.stringify({
							Message: JSON.stringify({
								entity: "record",
								action: "create",
								body: { record: { recordId: "1" } },
							}),
						}),
						attributes: {
							ApproximateReceiveCount: "1",
							SentTimestamp: "1",
							SenderId: "1",
							ApproximateFirstReceiveTimestamp: "1",
						},
						messageAttributes: {},
						md5OfBody: "1",
						eventSource: "1",
						eventSourceARN: "1",
						awsRegion: "1",
					},
				],
			},
			mock<Context>(),
			jest.fn(),
		);

		expect(triggerArchivematicaProcessing).toHaveBeenCalledWith(
			"1",
			"originals/1/1",
			{
				archivematicaHostUrl: "https://example.com",
				archivematicaApiKey: "test-api-key",
				archivematicaOriginalLocationId: "a6962a82-5462-4d9c-9ea1-5b9982ed625a",
			},
		);
	});

	test("should not trigger archivematica processing for deleted file", async () => {
		await handler(
			{
				Records: [
					{
						messageId: "1",
						receiptHandle: "1",
						body: JSON.stringify({
							Message: JSON.stringify({
								entity: "record",
								action: "create",
								body: { record: { recordId: "2" } },
							}),
						}),
						attributes: {
							ApproximateReceiveCount: "1",
							SentTimestamp: "1",
							SenderId: "1",
							ApproximateFirstReceiveTimestamp: "1",
						},
						messageAttributes: {},
						md5OfBody: "1",
						eventSource: "1",
						eventSourceARN: "1",
						awsRegion: "1",
					},
				],
			},
			mock<Context>(),
			jest.fn(),
		);

		expect(triggerArchivematicaProcessing).not.toHaveBeenCalled();
	});

	test("should handle multiple records", async () => {
		await handler(
			{
				Records: [
					{
						messageId: "1",
						receiptHandle: "1",
						body: JSON.stringify({
							Message: JSON.stringify({
								entity: "record",
								action: "create",
								body: { record: { recordId: "1" } },
							}),
						}),
						attributes: {
							ApproximateReceiveCount: "1",
							SentTimestamp: "1",
							SenderId: "1",
							ApproximateFirstReceiveTimestamp: "1",
						},
						messageAttributes: {},
						md5OfBody: "1",
						eventSource: "1",
						eventSourceARN: "1",
						awsRegion: "1",
					},
					{
						messageId: "2",
						receiptHandle: "2",
						body: JSON.stringify({
							Message: JSON.stringify({
								entity: "record",
								action: "create",
								body: { record: { recordId: "2" } },
							}),
						}),
						attributes: {
							ApproximateReceiveCount: "1",
							SentTimestamp: "1",
							SenderId: "1",
							ApproximateFirstReceiveTimestamp: "1",
						},
						messageAttributes: {},
						md5OfBody: "1",
						eventSource: "1",
						eventSourceARN: "1",
						awsRegion: "1",
					},
				],
			},
			mock<Context>(),
			jest.fn(),
		);

		expect(triggerArchivematicaProcessing).toHaveBeenCalledTimes(1);
		expect(triggerArchivematicaProcessing).toHaveBeenCalledWith(
			"1",
			"originals/1/1",
			{
				archivematicaHostUrl: "https://example.com",
				archivematicaApiKey: "test-api-key",
				archivematicaOriginalLocationId: "a6962a82-5462-4d9c-9ea1-5b9982ed625a",
			},
		);
	});
	test("should throw error when database query fails", async () => {
		const dbError = new Error("Database connection failed");
		jest.spyOn(db, "sql").mockRejectedValueOnce(dbError);

		await expect(
			handler(
				{
					Records: [
						{
							messageId: "1",
							receiptHandle: "1",
							body: JSON.stringify({
								Message: JSON.stringify({
									entity: "record",
									action: "create",
									body: { record: { recordId: "1" } },
								}),
							}),
							attributes: {
								ApproximateReceiveCount: "1",
								SentTimestamp: "1",
								SenderId: "1",
								ApproximateFirstReceiveTimestamp: "1",
							},
							messageAttributes: {},
							md5OfBody: "1",
							eventSource: "1",
							eventSourceARN: "1",
							awsRegion: "1",
						},
					],
				},
				mock<Context>(),
				jest.fn(),
			),
		).rejects.toThrow("Database connection failed");

		expect(logger.error).toHaveBeenCalledWith(dbError);
		expect(triggerArchivematicaProcessing).not.toHaveBeenCalled();
	});

	test("should throw error when Archivematica processing throws", async () => {
		const archivematicaError = new Error("Failed to trigger Archivematica");
		jest
			.mocked(triggerArchivematicaProcessing)
			.mockRejectedValueOnce(archivematicaError);

		await expect(
			handler(
				{
					Records: [
						{
							messageId: "1",
							receiptHandle: "1",
							body: JSON.stringify({
								Message: JSON.stringify({
									entity: "record",
									action: "create",
									body: { record: { recordId: "1" } },
								}),
							}),
							attributes: {
								ApproximateReceiveCount: "1",
								SentTimestamp: "1",
								SenderId: "1",
								ApproximateFirstReceiveTimestamp: "1",
							},
							messageAttributes: {},
							md5OfBody: "1",
							eventSource: "1",
							eventSourceARN: "1",
							awsRegion: "1",
						},
					],
				},
				mock<Context>(),
				jest.fn(),
			),
		).rejects.toThrow("Failed to trigger Archivematica");

		expect(logger.error).toHaveBeenCalledWith(archivematicaError);
		expect(triggerArchivematicaProcessing).toHaveBeenCalledWith(
			"1",
			"originals/1/1",
			{
				archivematicaHostUrl: "https://example.com",
				archivematicaApiKey: "test-api-key",
				archivematicaOriginalLocationId: "a6962a82-5462-4d9c-9ea1-5b9982ed625a",
			},
		);
	});

	test("should throw error when Archivematica processing fails without an exception", async () => {
		jest
			.mocked(triggerArchivematicaProcessing)
			.mockImplementation(
				jest.fn().mockResolvedValueOnce({ ok: false, status: 404 }),
			);

		await expect(
			handler(
				{
					Records: [
						{
							messageId: "1",
							receiptHandle: "1",
							body: JSON.stringify({
								Message: JSON.stringify({
									entity: "record",
									action: "create",
									body: { record: { recordId: "1" } },
								}),
							}),
							attributes: {
								ApproximateReceiveCount: "1",
								SentTimestamp: "1",
								SenderId: "1",
								ApproximateFirstReceiveTimestamp: "1",
							},
							messageAttributes: {},
							md5OfBody: "1",
							eventSource: "1",
							eventSourceARN: "1",
							awsRegion: "1",
						},
					],
				},
				mock<Context>(),
				jest.fn(),
			),
		).rejects.toThrow("Call to Archivematica failed with status 404");

		expect(logger.error).toHaveBeenCalledWith(404);
		expect(triggerArchivematicaProcessing).toHaveBeenCalledWith(
			"1",
			"originals/1/1",
			{
				archivematicaHostUrl: "https://example.com",
				archivematicaApiKey: "test-api-key",
				archivematicaOriginalLocationId: "a6962a82-5462-4d9c-9ea1-5b9982ed625a",
			},
		);
	});
});
