import type { Context, SQSRecord } from "aws-lambda";
import { S3Client, CopyObjectCommand } from "@aws-sdk/client-s3";
import { mock } from "jest-mock-extended";
import { constructSignedCdnUrl } from "@stela/s3-utils";
import { logger } from "@stela/logger";
import { db } from "./database";
import { handler, extractFileDataFromFileCopyMessage } from "./index";

jest.mock("./database");
jest.mock("@stela/logger");
jest.mock("@aws-sdk/client-s3");
jest.mock("@stela/s3-utils", (): unknown => ({
	...jest.requireActual("@stela/s3-utils"),
	constructSignedCdnUrl: jest.fn(),
}));

const mockS3Send = jest.fn();

const originalCloudPath = "originals/100/100";
const newCloudPath = "originals/101/101";
const testFileUrl = "https://cdn.example.com/file.jpg";
const testDownloadUrl = "https://cdn.example.com/download.jpg";
const testEventId = "63b9b137-d049-4697-9b91-24c1caf9f1db";

const buildSqsRecord = (
	messageBody: unknown,
	messageId = "test-message-id",
): SQSRecord => ({
	messageId,
	receiptHandle: "1",
	body: JSON.stringify({
		Message: JSON.stringify(messageBody),
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
});

const buildFileCopyRecord = (): SQSRecord =>
	buildSqsRecord({
		id: testEventId,
		entity: "file",
		action: "copy",
		body: {
			file: { fileid: 100, cloudpath: originalCloudPath },
			newFile: { fileid: 101 },
		},
	});

describe("extractFileDataFromFileCopyMessage", () => {
	test("should extract file data from a well-formed message", () => {
		const result = extractFileDataFromFileCopyMessage(
			buildSqsRecord({
				id: "test-event-id",
				entity: "file",
				action: "copy",
				body: {
					file: { fileid: 100, cloudpath: originalCloudPath },
					newFile: { fileid: 101 },
				},
			}),
		);

		expect(result).toEqual({
			eventId: "test-event-id",
			originalFileId: "100",
			newFileId: "101",
			originalFileCloudPath: originalCloudPath,
		});
	});

	test("should throw if the SQS body is missing the Message field", () => {
		let error = null;
		try {
			extractFileDataFromFileCopyMessage({
				...buildSqsRecord({}),
				body: JSON.stringify({ notMessage: "wrong" }),
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
			expect(logger.error).toHaveBeenCalled();
		}
	});

	test("should throw if the inner message is not a valid file copy event", () => {
		let error = null;
		try {
			extractFileDataFromFileCopyMessage(
				buildSqsRecord({ entity: "record", action: "create" }),
			);
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
});

describe("handler", () => {
	const loadFixtures = async (): Promise<void> => {
		await db.sql("fixtures.create_test_accounts");
		await db.sql("fixtures.create_test_archives");
		await db.sql("fixtures.create_test_records");
		await db.sql("fixtures.create_test_files");
		await db.sql("fixtures.create_test_record_files");
		await db.sql("fixtures.create_test_events");
	};

	const clearDatabase = async (): Promise<void> => {
		await db.query(
			`TRUNCATE
        account,
        archive,
        record,
        record_file,
        file,
        event
      CASCADE`,
		);
	};

	beforeEach(async () => {
		jest.mocked(S3Client).mockImplementation(
			jest.fn().mockReturnValue({
				send: mockS3Send.mockResolvedValue({}),
			}),
		);
		jest
			.mocked(constructSignedCdnUrl)
			.mockReturnValueOnce(testFileUrl)
			.mockReturnValueOnce(testDownloadUrl);
		await loadFixtures();
	});

	afterEach(async () => {
		await clearDatabase();
		jest.clearAllMocks();
		jest.restoreAllMocks();
	});

	test("should copy the S3 object and update the file record", async () => {
		await handler(
			{ Records: [buildFileCopyRecord()] },
			mock<Context>(),
			jest.fn(),
		);

		const commandInput = jest.mocked(CopyObjectCommand).mock.calls.at(0)?.[0];
		expect(commandInput?.CopySource).toEqual(`/${originalCloudPath}`);
		expect(commandInput?.Key).toEqual(newCloudPath);

		const {
			rows: [updatedFile],
		} = await db.query<{
			fileurl: string;
			downloadurl: string;
			urldt: string;
			cloudpath: string;
		}>(
			"SELECT fileurl, downloadurl, urldt, cloudpath FROM file WHERE fileid = 101",
		);
		expect(updatedFile?.fileurl).toEqual(testFileUrl);
		expect(updatedFile?.downloadurl).toEqual(testDownloadUrl);
		expect(updatedFile?.urldt).not.toBeNull();
		expect(updatedFile?.cloudpath).toEqual(newCloudPath);
	});

	test("should copy an old file not stored in originals to originals", async () => {
		const messageWithOldFile = buildSqsRecord({
			id: testEventId,
			entity: "file",
			action: "copy",
			body: {
				file: { fileid: 100, cloudpath: "100" },
				newFile: { fileid: 101 },
			},
		});

		await handler(
			{ Records: [messageWithOldFile] },
			mock<Context>(),
			jest.fn(),
		);

		const {
			rows: [updatedFile],
		} = await db.query<{
			fileurl: string;
			downloadurl: string;
			urldt: string;
			cloudpath: string;
		}>(
			"SELECT fileurl, downloadurl, urldt, cloudpath FROM file WHERE fileid = 101",
		);
		expect(updatedFile?.cloudpath).toEqual(newCloudPath);
	});

	test("should copy an old file in a local environment correctly", async () => {
		const messageWithOldFile = buildSqsRecord({
			id: testEventId,
			entity: "file",
			action: "copy",
			body: {
				file: { fileid: 100, cloudpath: "_DevName/100" },
				newFile: { fileid: 101 },
			},
		});

		await handler(
			{ Records: [messageWithOldFile] },
			mock<Context>(),
			jest.fn(),
		);

		const {
			rows: [updatedFile],
		} = await db.query<{
			fileurl: string;
			downloadurl: string;
			urldt: string;
			cloudpath: string;
		}>(
			"SELECT fileurl, downloadurl, urldt, cloudpath FROM file WHERE fileid = 101",
		);
		expect(updatedFile?.cloudpath).toEqual(`_DevName/${newCloudPath}`);
	});

	test("should throw if the S3 copy fails", async () => {
		const testError = new Error("S3 error");
		mockS3Send.mockRejectedValueOnce(testError);

		let error = null;
		try {
			await handler(
				{ Records: [buildFileCopyRecord()] },
				mock<Context>(),
				jest.fn(),
			);
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
			expect(logger.error).toHaveBeenCalledWith(testError);
		}
	});

	test("should throw if the new file does not exist in the database", async () => {
		const messageWithMissingFile = buildSqsRecord({
			id: testEventId,
			entity: "file",
			action: "copy",
			body: {
				file: { fileid: 100, cloudpath: originalCloudPath },
				newFile: { fileid: 999 },
			},
		});

		let error = null;
		try {
			await handler(
				{ Records: [messageWithMissingFile] },
				mock<Context>(),
				jest.fn(),
			);
		} catch (err) {
			error = err;
		} finally {
			expect(logger.error).toHaveBeenCalledWith("Failed to look up new file");
			expect(error).not.toBeNull();
		}
	});

	test("should throw if the get_file_upload_name query fails", async () => {
		const testError = new Error("database error");

		jest.spyOn(db, "sql").mockRejectedValueOnce(testError);

		let error = null;
		try {
			await handler(
				{ Records: [buildFileCopyRecord()] },
				mock<Context>(),
				jest.fn(),
			);
		} catch (err) {
			error = err;
		} finally {
			expect(logger.error).toHaveBeenCalledWith(testError);
			expect(error).not.toBeNull();
		}
	});

	test("should not insert a duplicate event when the message is processed twice", async () => {
		await handler(
			{ Records: [buildFileCopyRecord()] },
			mock<Context>(),
			jest.fn(),
		);

		jest
			.mocked(constructSignedCdnUrl)
			.mockReturnValueOnce(testFileUrl)
			.mockReturnValueOnce(testDownloadUrl);

		await handler(
			{ Records: [buildFileCopyRecord()] },
			mock<Context>(),
			jest.fn(),
		);

		const { rows } = await db.query<{ count: string }>(
			`SELECT COUNT(*) AS count FROM event WHERE entity = 'record' AND action = 'copy'`,
		);
		expect(rows[0]?.count).toEqual("1");
	});

	test("should throw if the update_file_and_send_event query fails", async () => {
		const testError = new Error("database error");

		jest
			.spyOn(db, "sql")
			.mockResolvedValueOnce({
				command: "",
				row_count: 1,
				rows: [{ uploadFileName: "new_file.jpg" }],
			})
			.mockRejectedValueOnce(testError);

		let error = null;
		try {
			await handler(
				{ Records: [buildFileCopyRecord()] },
				mock<Context>(),
				jest.fn(),
			);
		} catch (err) {
			error = err;
		} finally {
			expect(logger.error).toHaveBeenCalledWith(testError);
			expect(error).not.toBeNull();
		}
	});
});
