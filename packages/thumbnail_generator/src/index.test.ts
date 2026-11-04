import { readFileSync } from "node:fs";
import * as path from "node:path";
import type { Context, SQSRecord } from "aws-lambda";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
	S3Client,
	GetObjectCommand,
	PutObjectCommand,
} from "@aws-sdk/client-s3";
import { mock } from "vitest-mock-extended";
import sharp from "sharp";
import { constructSignedCdnUrl } from "@stela/s3-utils";
import { logger } from "@stela/logger";
import { db } from "./database.js";
import {
	handler,
	extractRecordIdFromRecordEventMessage,
	generateThumbnailCloudPath,
} from "./index.js";

vi.mock("./database");
vi.mock("@stela/logger");
vi.mock(import("@stela/s3-utils"), async (importOriginal) => {
	const actual = await importOriginal();
	return {
		...actual,
		constructSignedCdnUrl: vi.fn(),
	};
});

const testThumbnailUrl = "https://cdn.example.com/thumbnail.jpg";

const buildSqsRecord = (messageBody: unknown): SQSRecord => ({
	messageId: "test-message-id",
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

const buildRecordCreateMessage = (recordId: string): SQSRecord =>
	buildSqsRecord({
		entity: "record",
		action: "create",
		body: { record: { recordId } },
	});

const buildRecordCopyMessage = (newRecordId: string): SQSRecord =>
	buildSqsRecord({
		entity: "record",
		action: "copy",
		body: { record: { recordId: "999" }, newRecord: { recordId: newRecordId } },
	});

const createTestImage = async (
	width: number,
	height: number,
	orientation?: number,
): Promise<Buffer> => {
	const image = sharp({
		create: {
			width,
			height,
			channels: 3,
			background: { r: 200, g: 100, b: 50 },
		},
	});
	return orientation === undefined
		? await image.png().toBuffer()
		: await image.withMetadata({ orientation }).jpeg().toBuffer();
};

describe("extractRecordIdFromRecordEventMessage", () => {
	test("should extract the record ID from a record.create event", () => {
		expect(
			extractRecordIdFromRecordEventMessage(buildRecordCreateMessage("1")),
		).toEqual("1");
	});

	test("should extract the new record's ID from a record.copy event", () => {
		expect(
			extractRecordIdFromRecordEventMessage(buildRecordCopyMessage("2")),
		).toEqual("2");
	});

	test("should throw if the SQS body is missing the Message field", () => {
		expect(() =>
			extractRecordIdFromRecordEventMessage({
				...buildSqsRecord({}),
				body: JSON.stringify({ notMessage: "wrong" }),
			}),
		).toThrow();
		expect(logger.error).toHaveBeenCalled();
	});

	test("should throw if the message is not a record event", () => {
		expect(() =>
			extractRecordIdFromRecordEventMessage(buildSqsRecord({ foo: "bar" })),
		).toThrow();
	});

	test("should throw if a record.create event is missing the record", () => {
		expect(() =>
			extractRecordIdFromRecordEventMessage(
				buildSqsRecord({ entity: "record", action: "create", body: {} }),
			),
		).toThrow();
	});

	test("should throw if a record.copy event is missing the new record", () => {
		expect(() =>
			extractRecordIdFromRecordEventMessage(
				buildSqsRecord({
					entity: "record",
					action: "copy",
					body: { record: { recordId: "1" } },
				}),
			),
		).toThrow();
	});

	test("should throw on an unsupported action", () => {
		expect(() =>
			extractRecordIdFromRecordEventMessage(
				buildSqsRecord({
					entity: "record",
					action: "delete",
					body: { record: { recordId: "1" } },
				}),
			),
		).toThrow();
	});
});

describe("generateThumbnailCloudPath", () => {
	test("should put thumbnails under a top-level thumbnails prefix", () => {
		expect(generateThumbnailCloudPath("originals/100/100", "100")).toEqual(
			"thumbnails/100/256.jpg",
		);
	});

	test("should handle old-style cloud paths", () => {
		expect(generateThumbnailCloudPath("100", "100")).toEqual(
			"thumbnails/100/256.jpg",
		);
	});

	test("should preserve a local developer prefix", () => {
		expect(
			generateThumbnailCloudPath("_DevName/originals/100/100", "100"),
		).toEqual("_DevName/thumbnails/100/256.jpg");
		expect(generateThumbnailCloudPath("_DevName/100", "100")).toEqual(
			"_DevName/thumbnails/100/256.jpg",
		);
	});
});

describe("handler", () => {
	const mockS3Send = vi.fn();
	let sourceImage: Buffer = Buffer.from("");

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
        record_file,
        file
      CASCADE`,
		);
	};

	const getRecordThumbnail = async (
		recordId: number,
	): Promise<
		| {
				thumbnail256: string | null;
				thumbnail256cloudpath: string | null;
				thumbdt: Date | null;
		  }
		| undefined
	> => {
		const result = await db.query<{
			thumbnail256: string | null;
			thumbnail256cloudpath: string | null;
			thumbdt: Date | null;
		}>(
			"SELECT thumbnail256, thumbnail256cloudpath, thumbdt FROM record WHERE recordid = :recordId",
			{ recordId },
		);
		return result.rows[0];
	};

	const getPutCommands = (): PutObjectCommand[] =>
		mockS3Send.mock.calls
			.map((call: unknown[]) => call[0])
			.filter(
				(command): command is PutObjectCommand =>
					command instanceof PutObjectCommand,
			);

	const getUploadedThumbnail = (): Buffer => {
		const body = getPutCommands()[0]?.input.Body;
		if (!(body instanceof Buffer)) {
			throw new Error("No thumbnail was uploaded");
		}
		return body;
	};

	const getGetCommands = (): GetObjectCommand[] =>
		mockS3Send.mock.calls
			.map((call: unknown[]) => call[0])
			.filter(
				(command): command is GetObjectCommand =>
					command instanceof GetObjectCommand,
			);

	const failQuery = (queryName: string, error: Error): void => {
		const originalSql = db.sql.bind(db);
		vi.spyOn(db, "sql").mockImplementation(async (name, params) => {
			if (name === queryName) {
				throw error;
			}
			return await originalSql(name, params);
		});
	};

	beforeEach(async () => {
		vi.stubEnv("AWS_REGION", "us-west-2");
		sourceImage = await createTestImage(1024, 512);
		mockS3Send.mockImplementation(async (command: unknown) => {
			if (command instanceof GetObjectCommand) {
				return {
					Body: {
						transformToByteArray: async () => new Uint8Array(sourceImage),
					},
				};
			}
			return {};
		});
		vi.spyOn(S3Client.prototype, "send").mockImplementation(mockS3Send);
		vi.mocked(constructSignedCdnUrl).mockReturnValue(testThumbnailUrl);
		await clearDatabase();
		await loadFixtures();
	});

	afterEach(async () => {
		await clearDatabase();
		vi.clearAllMocks();
		vi.restoreAllMocks();
		vi.unstubAllEnvs();
	});

	test("should generate a width-256 JPEG thumbnail for a new image record", async () => {
		await handler(
			{ Records: [buildRecordCreateMessage("1")] },
			mock<Context>(),
			vi.fn(),
		);

		expect(getGetCommands()[0]?.input.Key).toEqual("originals/100/100");

		const putCommands = getPutCommands();
		expect(putCommands).toHaveLength(1);
		expect(putCommands[0]?.input.Key).toEqual("thumbnails/100/256.jpg");
		expect(putCommands[0]?.input.ContentType).toEqual("image/jpeg");
		const thumbnailMetadata = await sharp(getUploadedThumbnail()).metadata();
		expect(thumbnailMetadata.format).toEqual("jpeg");
		expect(thumbnailMetadata.width).toEqual(256);
		expect(thumbnailMetadata.height).toEqual(128);

		expect(constructSignedCdnUrl).toHaveBeenCalledWith(
			"thumbnails/100/256.jpg",
		);
		const record = await getRecordThumbnail(1);
		expect(record?.thumbnail256).toEqual(testThumbnailUrl);
		expect(record?.thumbnail256cloudpath).toEqual("thumbnails/100/256.jpg");
		expect(record?.thumbdt).not.toBeNull();
	});

	test("should generate a thumbnail for a copied image record", async () => {
		await handler(
			{ Records: [buildRecordCopyMessage("1")] },
			mock<Context>(),
			vi.fn(),
		);

		expect(getPutCommands()).toHaveLength(1);
		const record = await getRecordThumbnail(1);
		expect(record?.thumbnail256).toEqual(testThumbnailUrl);
	});

	test("should generate a thumbnail for a HEIC image", async () => {
		sourceImage = readFileSync(
			path.join(import.meta.dirname, "../test-data/sample.heic"),
		);

		await handler(
			{ Records: [buildRecordCreateMessage("1")] },
			mock<Context>(),
			vi.fn(),
		);

		const thumbnailMetadata = await sharp(getUploadedThumbnail()).metadata();
		expect(thumbnailMetadata.format).toEqual("jpeg");
		expect(thumbnailMetadata.width).toEqual(256);
		expect(thumbnailMetadata.height).toEqual(128);
		const record = await getRecordThumbnail(1);
		expect(record?.thumbnail256).toEqual(testThumbnailUrl);
	});

	test("should apply EXIF orientation before resizing", async () => {
		// Orientation 6 means the stored pixels must be rotated 90 degrees for display
		sourceImage = await createTestImage(1024, 512, 6);

		await handler(
			{ Records: [buildRecordCreateMessage("1")] },
			mock<Context>(),
			vi.fn(),
		);

		const thumbnailMetadata = await sharp(getUploadedThumbnail()).metadata();
		expect(thumbnailMetadata.width).toEqual(256);
		expect(thumbnailMetadata.height).toEqual(512);
	});

	test("should not enlarge images narrower than the thumbnail width", async () => {
		sourceImage = await createTestImage(100, 50);

		await handler(
			{ Records: [buildRecordCreateMessage("1")] },
			mock<Context>(),
			vi.fn(),
		);

		const thumbnailMetadata = await sharp(getUploadedThumbnail()).metadata();
		expect(thumbnailMetadata.width).toEqual(100);
		expect(thumbnailMetadata.height).toEqual(50);
	});

	test("should keep a local developer prefix on the thumbnail path", async () => {
		await handler(
			{ Records: [buildRecordCreateMessage("5")] },
			mock<Context>(),
			vi.fn(),
		);

		expect(getGetCommands()[0]?.input.Key).toEqual(
			"_DevName/originals/500/500",
		);
		expect(getPutCommands()[0]?.input.Key).toEqual(
			"_DevName/thumbnails/500/256.jpg",
		);
		const record = await getRecordThumbnail(5);
		expect(record?.thumbnail256cloudpath).toEqual(
			"_DevName/thumbnails/500/256.jpg",
		);
	});

	test("should skip images larger than 200 MB", async () => {
		await handler(
			{ Records: [buildRecordCreateMessage("2")] },
			mock<Context>(),
			vi.fn(),
		);

		expect(mockS3Send).not.toHaveBeenCalled();
		const record = await getRecordThumbnail(2);
		expect(record?.thumbnail256).toBeNull();
	});

	test("should skip records that are not images", async () => {
		await handler(
			{ Records: [buildRecordCreateMessage("3")] },
			mock<Context>(),
			vi.fn(),
		);

		expect(mockS3Send).not.toHaveBeenCalled();
		const record = await getRecordThumbnail(3);
		expect(record?.thumbnail256).toBeNull();
	});

	test("should not overwrite an existing thumbnail", async () => {
		await handler(
			{ Records: [buildRecordCreateMessage("4")] },
			mock<Context>(),
			vi.fn(),
		);

		expect(mockS3Send).not.toHaveBeenCalled();
		const record = await getRecordThumbnail(4);
		expect(record?.thumbnail256).toEqual(
			"https://cdn.example.com/existing-thumbnail.jpg",
		);
		expect(record?.thumbnail256cloudpath).toEqual("thumbnails/400/256.jpg");
	});

	test("should log and skip records without an original file", async () => {
		await handler(
			{ Records: [buildRecordCreateMessage("6")] },
			mock<Context>(),
			vi.fn(),
		);

		expect(mockS3Send).not.toHaveBeenCalled();
		expect(logger.error).toHaveBeenCalledWith(
			"Original file not found for record 6",
		);
	});

	test("should skip without retrying if the image can't be decoded", async () => {
		sourceImage = Buffer.from("this is not an image");

		await handler(
			{ Records: [buildRecordCreateMessage("1")] },
			mock<Context>(),
			vi.fn(),
		);

		expect(getPutCommands()).toHaveLength(0);
		expect(logger.warn).toHaveBeenCalledWith(
			"Failed to generate thumbnail for record 1",
		);
		const record = await getRecordThumbnail(1);
		expect(record?.thumbnail256).toBeNull();
	});

	test("should throw if downloading the original fails", async () => {
		const testError = new Error("S3 error");
		mockS3Send.mockRejectedValueOnce(testError);

		await expect(
			handler(
				{ Records: [buildRecordCreateMessage("1")] },
				mock<Context>(),
				vi.fn(),
			),
		).rejects.toThrow("S3 error");
		expect(logger.error).toHaveBeenCalledWith(testError);
	});

	test("should throw if uploading the thumbnail fails", async () => {
		const testError = new Error("S3 upload error");
		mockS3Send.mockImplementation(async (command: unknown) => {
			if (command instanceof GetObjectCommand) {
				return {
					Body: {
						transformToByteArray: async () => new Uint8Array(sourceImage),
					},
				};
			}
			throw testError;
		});

		await expect(
			handler(
				{ Records: [buildRecordCreateMessage("1")] },
				mock<Context>(),
				vi.fn(),
			),
		).rejects.toThrow("S3 upload error");
		const record = await getRecordThumbnail(1);
		expect(record?.thumbnail256).toBeNull();
	});

	test("should throw if looking up the original file fails", async () => {
		const testError = new Error("Database error");
		failQuery("queries.get_original_file", testError);

		await expect(
			handler(
				{ Records: [buildRecordCreateMessage("1")] },
				mock<Context>(),
				vi.fn(),
			),
		).rejects.toThrow("Database error");
		expect(logger.error).toHaveBeenCalledWith(testError);
		expect(mockS3Send).not.toHaveBeenCalled();
	});

	test("should throw if S3 returns no body for the original", async () => {
		mockS3Send.mockResolvedValueOnce({});

		await expect(
			handler(
				{ Records: [buildRecordCreateMessage("1")] },
				mock<Context>(),
				vi.fn(),
			),
		).rejects.toThrow("Empty S3 response body for originals/100/100");
		expect(logger.error).toHaveBeenCalledWith(
			"Empty S3 response body for originals/100/100",
		);
		expect(getPutCommands()).toHaveLength(0);
	});

	test("should throw if saving the thumbnail to the record fails", async () => {
		const testError = new Error("Database error");
		failQuery("queries.update_record_thumbnail", testError);

		await expect(
			handler(
				{ Records: [buildRecordCreateMessage("1")] },
				mock<Context>(),
				vi.fn(),
			),
		).rejects.toThrow("Database error");
		expect(logger.error).toHaveBeenCalledWith(testError);
		expect(getPutCommands()).toHaveLength(1);
		const record = await getRecordThumbnail(1);
		expect(record?.thumbnail256).toBeNull();
	});
});
