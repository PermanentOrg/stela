import type { Context } from "aws-lambda";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { S3Client } from "@aws-sdk/client-s3";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { logger } from "@stela/logger";
import { db } from "./database";
import { handler } from "./index";
vi.mock("./database");
vi.mock("@stela/logger");
vi.mock("@aws-sdk/client-s3");

describe("handler", () => {
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
        record_file,
        tag,
        tag_link
      CASCADE`,
		);
	};

	const loadMetsFile = async (filename: string): Promise<string> =>
		await fs.readFile(path.join(__dirname, "fixtures", filename), "utf-8");

	const getRecordMetadata = async (
		recordId: string,
	): Promise<
		| {
				displayName: string;
				description: string | null;
				derivedTimestamp: Date | null;
				displayTime: string | null;
				tags: string[];
				altText: string | null;
		  }
		| undefined
	> => {
		const metadata = await db.query<{
			displayName: string;
			description: string | null;
			derivedTimestamp: Date | null;
			displayTime: string | null;
			tags: string[];
			altText: string | null;
		}>(
			`
			SELECT
				record.displayname AS "displayName",
				record.description,
				record.deriveddt AS "derivedTimestamp",
				record.displaytime AS "displayTime",
				array_remove(array_agg(tag.name), NULL) AS "tags",
				alttext AS "altText"
			FROM
				record
			LEFT JOIN
				tag_link
				ON record.recordid = tag_link.refid
			LEFT JOIN
				tag
				ON tag_link.tagid = tag.tagid
			WHERE
				record.recordid = :recordId
				AND (tag_link.reftable = 'record' OR tag_link.reftable IS NULL)
			GROUP BY record.recordid, record.displayname, record.description, record.deriveddt;
	`,
			{ recordId },
		);
		return metadata.rows[0];
	};

	const mockS3Send = vi.fn();

	beforeEach(async () => {
		await loadFixtures();
		mockS3Send.mockClear();
		vi.spyOn(S3Client.prototype, "send").mockImplementation(mockS3Send);
	});

	afterEach(async () => {
		await clearDatabase();
		vi.clearAllMocks();
		vi.restoreAllMocks();
	});

	test("should skip non-METS files", async () => {
		const event = {
			Records: [
				{
					messageId: "1",
					receiptHandle: "1",
					body: JSON.stringify({
						Message: JSON.stringify({
							Records: [
								{
									s3: {
										bucket: {
											name: "test-bucket",
										},
										object: {
											key: "access_copies/53f9/8c3d/a29e/4fbf/8a4a/4fd9/991e/313d/1_upload-4a64ba7c-ceac-4547-ac13-c487b2711d5a/4a64ba7c-ceac-4547-ac13-c487b2711d5a.jpg",
										},
									},
								},
							],
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
		};

		await handler(event, mock<Context>(), vi.fn());

		// Verify that S3 was not called
		expect(mockS3Send).not.toHaveBeenCalled();
	});

	test("should extract and update metadata for a file with complete metadata", async () => {
		const metsContent = await loadMetsFile("sample_mets.xml");
		mockS3Send.mockResolvedValue({
			Body: {
				transformToString: vi.fn().mockResolvedValue(metsContent),
			},
		});

		const event = {
			Records: [
				{
					messageId: "1",
					receiptHandle: "1",
					body: JSON.stringify({
						Message: JSON.stringify({
							Records: [
								{
									s3: {
										bucket: {
											name: "test-bucket",
										},
										object: {
											key: "access_copies/53f9/8c3d/a29e/4fbf/8a4a/4fd9/991e/313d/1_upload-4a64ba7c-ceac-4547-ac13-c487b2711d5a/METS.4a64ba7c-ceac-4547-ac13-c487b2711d5a.xml",
										},
									},
								},
							],
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
		};

		await handler(event, mock<Context>(), vi.fn());

		expect(mockS3Send).toHaveBeenCalledTimes(1);

		const recordMetadata = await getRecordMetadata("1");
		expect(recordMetadata).toBeDefined();
		expect(recordMetadata?.displayName).toEqual("Test Image Title");
		expect(recordMetadata?.description).toEqual(
			"This is a test image description",
		);
		expect(recordMetadata?.derivedTimestamp).toEqual(
			new Date("2023-06-15T21:30:00.000Z"),
		);
		expect(recordMetadata?.displayTime).toEqual("2023-06-15T21:30:00Z");
		expect(recordMetadata?.tags.sort()).toEqual(
			["nature", "landscape", "sunset"].sort(),
		);
		expect(recordMetadata?.altText).toEqual(
			"This is the Alt Text description to support accessibility in 2021.1",
		);
	});

	test("should update displayName if it is the upload name without its extension", async () => {
		const metsContent = await loadMetsFile("sample_mets.xml");
		mockS3Send.mockResolvedValue({
			Body: {
				transformToString: vi.fn().mockResolvedValue(metsContent),
			},
		});

		await db.query(
			`UPDATE record SET displayname = 'test_file' WHERE recordid = 1`,
		);

		const event = {
			Records: [
				{
					messageId: "1",
					receiptHandle: "1",
					body: JSON.stringify({
						Message: JSON.stringify({
							Records: [
								{
									s3: {
										bucket: {
											name: "test-bucket",
										},
										object: {
											key: "access_copies/53f9/8c3d/a29e/4fbf/8a4a/4fd9/991e/313d/1_upload-4a64ba7c-ceac-4547-ac13-c487b2711d5a/METS.4a64ba7c-ceac-4547-ac13-c487b2711d5a.xml",
										},
									},
								},
							],
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
		};

		await handler(event, mock<Context>(), vi.fn());

		expect(mockS3Send).toHaveBeenCalledTimes(1);

		const recordMetadata = await getRecordMetadata("1");
		expect(recordMetadata).toBeDefined();
		expect(recordMetadata?.displayName).toEqual("Test Image Title");
	});

	test("should not update displayName if the user has modified it", async () => {
		const metsContent = await loadMetsFile("sample_mets.xml");
		mockS3Send.mockResolvedValue({
			Body: {
				transformToString: vi.fn().mockResolvedValue(metsContent),
			},
		});

		await db.query(
			`UPDATE record SET displayname = 'Christmas Party 1994' WHERE recordid = 1`,
		);

		const event = {
			Records: [
				{
					messageId: "1",
					receiptHandle: "1",
					body: JSON.stringify({
						Message: JSON.stringify({
							Records: [
								{
									s3: {
										bucket: {
											name: "test-bucket",
										},
										object: {
											key: "access_copies/53f9/8c3d/a29e/4fbf/8a4a/4fd9/991e/313d/1_upload-4a64ba7c-ceac-4547-ac13-c487b2711d5a/METS.4a64ba7c-ceac-4547-ac13-c487b2711d5a.xml",
										},
									},
								},
							],
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
		};

		await handler(event, mock<Context>(), vi.fn());

		expect(mockS3Send).toHaveBeenCalledTimes(1);

		const recordMetadata = await getRecordMetadata("1");
		expect(recordMetadata).toBeDefined();
		expect(recordMetadata?.displayName).toEqual("Christmas Party 1994");
	});

	test("should handle metadata with missing optional fields", async () => {
		const metsContent = await loadMetsFile("minimal_mets.xml");
		mockS3Send.mockResolvedValue({
			Body: {
				transformToString: vi.fn().mockResolvedValue(metsContent),
			},
		});

		const event = {
			Records: [
				{
					messageId: "1",
					receiptHandle: "1",
					body: JSON.stringify({
						Message: JSON.stringify({
							Records: [
								{
									s3: {
										bucket: {
											name: "test-bucket",
										},
										object: {
											key: "access_copies/53f9/8c3d/a29e/4fbf/8a4a/4fd9/991e/313d/1_upload-4a64ba7c-ceac-4547-ac13-c487b2711d5a/METS.4a64ba7c-ceac-4547-ac13-c487b2711d5a.xml",
										},
									},
								},
							],
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
		};

		await handler(event, mock<Context>(), vi.fn());

		const recordMetadata = await getRecordMetadata("1");
		expect(recordMetadata).toBeDefined();
		expect(recordMetadata?.displayName).toEqual("test_file.jpg");
		expect(recordMetadata?.description).toEqual(null);
		expect(recordMetadata?.derivedTimestamp).toEqual(null);
		expect(recordMetadata?.tags.length).toEqual(0);
	});

	test("should process multiple messages in a single event", async () => {
		const metsContent = await loadMetsFile("sample_mets.xml");
		mockS3Send.mockResolvedValue({
			Body: {
				transformToString: vi.fn().mockResolvedValue(metsContent),
			},
		});

		const event = {
			Records: [
				{
					messageId: "1",
					receiptHandle: "1",
					body: JSON.stringify({
						Message: JSON.stringify({
							Records: [
								{
									s3: {
										bucket: {
											name: "test-bucket",
										},
										object: {
											key: "access_copies/53f9/8c3d/a29e/4fbf/8a4a/4fd9/991e/313d/1_upload-4a64ba7c-ceac-4547-ac13-c487b2711d5a/METS.4a64ba7c-ceac-4547-ac13-c487b2711d5a.xml",
										},
									},
								},
							],
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
							Records: [
								{
									s3: {
										bucket: {
											name: "test-bucket",
										},
										object: {
											key: "access_copies/53f9/8c3d/a29e/4fbf/8a4a/4fd9/991e/313d/1_upload-4a64ba7c-ceac-4547-ac13-c487b2711d5a/4a64ba7c-ceac-4547-ac13-c487b2711d5a.jpg",
										},
									},
								},
							],
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
		};

		await handler(event, mock<Context>(), vi.fn());

		expect(mockS3Send).toHaveBeenCalledTimes(1);
	});

	test("should throw an error if metadata file is empty", async () => {
		mockS3Send.mockResolvedValue({
			Body: undefined,
		});

		const event = {
			Records: [
				{
					messageId: "1",
					receiptHandle: "1",
					body: JSON.stringify({
						Message: JSON.stringify({
							Records: [
								{
									s3: {
										bucket: {
											name: "test-bucket",
										},
										object: {
											key: "access_copies/53f9/8c3d/a29e/4fbf/8a4a/4fd9/991e/313d/1_upload-4a64ba7c-ceac-4547-ac13-c487b2711d5a/METS.4a64ba7c-ceac-4547-ac13-c487b2711d5a.xml",
										},
									},
								},
							],
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
		};

		await expect(handler(event, mock<Context>(), vi.fn())).rejects.toThrow(
			"metadata file is empty",
		);
	});

	test("should throw an error if wrong number of administrative sections found", async () => {
		const metsContent = await loadMetsFile("multiple_admin_sections.xml");

		mockS3Send.mockResolvedValue({
			Body: {
				transformToString: vi.fn().mockResolvedValue(metsContent),
			},
		});

		const event = {
			Records: [
				{
					messageId: "1",
					receiptHandle: "1",
					body: JSON.stringify({
						Message: JSON.stringify({
							Records: [
								{
									s3: {
										bucket: {
											name: "test-bucket",
										},
										object: {
											key: "access_copies/53f9/8c3d/a29e/4fbf/8a4a/4fd9/991e/313d/1_upload-4a64ba7c-ceac-4547-ac13-c487b2711d5a/METS.4a64ba7c-ceac-4547-ac13-c487b2711d5a.xml",
										},
									},
								},
							],
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
		};

		await expect(handler(event, mock<Context>(), vi.fn())).rejects.toThrow(
			"Wrong number of administrative metadata sections for original file; expected 1, got 2",
		);
	});

	test("should handle invalid EXIF timestamp gracefully", async () => {
		const metsContent = await loadMetsFile("invalid_timestamp.xml");

		mockS3Send.mockResolvedValue({
			Body: {
				transformToString: vi.fn().mockResolvedValue(metsContent),
			},
		});

		const event = {
			Records: [
				{
					messageId: "1",
					receiptHandle: "1",
					body: JSON.stringify({
						Message: JSON.stringify({
							Records: [
								{
									s3: {
										bucket: {
											name: "test-bucket",
										},
										object: {
											key: "access_copies/53f9/8c3d/a29e/4fbf/8a4a/4fd9/991e/313d/1_upload-4a64ba7c-ceac-4547-ac13-c487b2711d5a/METS.4a64ba7c-ceac-4547-ac13-c487b2711d5a.xml",
										},
									},
								},
							],
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
		};

		await handler(event, mock<Context>(), vi.fn());

		expect(logger.info).toHaveBeenCalledWith(
			"Invalid timestamp: not_a_timestamp",
		);

		const recordMetadata = await getRecordMetadata("1");
		expect(recordMetadata).toBeDefined();
		expect(recordMetadata?.displayName).toEqual("Test Image Title");
		expect(recordMetadata?.description).toEqual(
			"This is a test image description",
		);
		expect(recordMetadata?.derivedTimestamp).toEqual(null);
		expect(recordMetadata?.displayTime).toEqual(null);
		expect(recordMetadata?.tags.sort()).toEqual(
			["nature", "landscape", "sunset"].sort(),
		);
	});

	test("should handle a missing timezone correctly", async () => {
		const metsContent = await loadMetsFile("no_timezone.xml");

		mockS3Send.mockResolvedValue({
			Body: {
				transformToString: vi.fn().mockResolvedValue(metsContent),
			},
		});

		const event = {
			Records: [
				{
					messageId: "1",
					receiptHandle: "1",
					body: JSON.stringify({
						Message: JSON.stringify({
							Records: [
								{
									s3: {
										bucket: {
											name: "test-bucket",
										},
										object: {
											key: "access_copies/53f9/8c3d/a29e/4fbf/8a4a/4fd9/991e/313d/1_upload-4a64ba7c-ceac-4547-ac13-c487b2711d5a/METS.4a64ba7c-ceac-4547-ac13-c487b2711d5a.xml",
										},
									},
								},
							],
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
		};

		await handler(event, mock<Context>(), vi.fn());

		const recordMetadata = await getRecordMetadata("1");
		expect(recordMetadata).toBeDefined();
		expect(recordMetadata?.derivedTimestamp).toEqual(null);
		expect(recordMetadata?.displayTime).toEqual("2023-06-15T21:30:00");
	});

	test("should extract a single IPTC keyword provided as a string", async () => {
		const metsContent = await loadMetsFile("single_keyword_mets.xml");
		mockS3Send.mockResolvedValue({
			Body: {
				transformToString: vi.fn().mockResolvedValue(metsContent),
			},
		});

		const event = {
			Records: [
				{
					messageId: "1",
					receiptHandle: "1",
					body: JSON.stringify({
						Message: JSON.stringify({
							Records: [
								{
									s3: {
										bucket: {
											name: "test-bucket",
										},
										object: {
											key: "access_copies/53f9/8c3d/a29e/4fbf/8a4a/4fd9/991e/313d/1_upload-4a64ba7c-ceac-4547-ac13-c487b2711d5a/METS.4a64ba7c-ceac-4547-ac13-c487b2711d5a.xml",
										},
									},
								},
							],
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
		};

		await handler(event, mock<Context>(), vi.fn());

		const recordMetadata = await getRecordMetadata("1");
		expect(recordMetadata).toBeDefined();
		expect(recordMetadata?.tags).toEqual(["nature"]);
	});

	test("should handle database error gracefully", async () => {
		const metsContent = await loadMetsFile("sample_mets.xml");
		mockS3Send.mockResolvedValue({
			Body: {
				transformToString: vi.fn().mockResolvedValue(metsContent),
			},
		});

		const dbError = new Error("Database connection failed");
		vi.spyOn(db, "sql").mockRejectedValue(dbError);

		const event = {
			Records: [
				{
					messageId: "1",
					receiptHandle: "1",
					body: JSON.stringify({
						Message: JSON.stringify({
							Records: [
								{
									s3: {
										bucket: {
											name: "test-bucket",
										},
										object: {
											key: "access_copies/53f9/8c3d/a29e/4fbf/8a4a/4fd9/991e/313d/1_upload-4a64ba7c-ceac-4547-ac13-c487b2711d5a/METS.4a64ba7c-ceac-4547-ac13-c487b2711d5a.xml",
										},
									},
								},
							],
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
		};

		await expect(handler(event, mock<Context>(), vi.fn())).rejects.toThrow(
			"Database connection failed",
		);
	});

	test("should extract timestamp from video with MediaInfo metadata", async () => {
		const metsContent = await loadMetsFile("video_mediainfo.xml");
		mockS3Send.mockResolvedValue({
			Body: {
				transformToString: vi.fn().mockResolvedValue(metsContent),
			},
		});

		const event = {
			Records: [
				{
					messageId: "1",
					receiptHandle: "1",
					body: JSON.stringify({
						Message: JSON.stringify({
							Records: [
								{
									s3: {
										bucket: {
											name: "test-bucket",
										},
										object: {
											key: "access_copies/53f9/8c3d/a29e/4fbf/8a4a/4fd9/991e/313d/1_upload-4a64ba7c-ceac-4547-ac13-c487b2711d5a/METS.4a64ba7c-ceac-4547-ac13-c487b2711d5a.xml",
										},
									},
								},
							],
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
		};

		await handler(event, mock<Context>(), vi.fn());

		expect(mockS3Send).toHaveBeenCalledTimes(1);

		const recordMetadata = await getRecordMetadata("1");
		expect(recordMetadata).toBeDefined();
		expect(recordMetadata?.derivedTimestamp).toEqual(
			new Date("2024-03-15T10:30:00.000Z"),
		);
		expect(recordMetadata?.displayTime).toEqual("2024-03-15T10:30:00Z");
		expect(recordMetadata?.displayName).toEqual("test_file.jpg");
		expect(recordMetadata?.description).toEqual(null);
		expect(recordMetadata?.tags.length).toEqual(0);
		expect(recordMetadata?.altText).toEqual(null);
	});

	test("should extract timestamp from video with QuickTime metadata", async () => {
		const metsContent = await loadMetsFile("video_quicktime.xml");
		mockS3Send.mockResolvedValue({
			Body: {
				transformToString: vi.fn().mockResolvedValue(metsContent),
			},
		});

		const event = {
			Records: [
				{
					messageId: "1",
					receiptHandle: "1",
					body: JSON.stringify({
						Message: JSON.stringify({
							Records: [
								{
									s3: {
										bucket: {
											name: "test-bucket",
										},
										object: {
											key: "access_copies/53f9/8c3d/a29e/4fbf/8a4a/4fd9/991e/313d/1_upload-4a64ba7c-ceac-4547-ac13-c487b2711d5a/METS.4a64ba7c-ceac-4547-ac13-c487b2711d5a.xml",
										},
									},
								},
							],
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
		};

		await handler(event, mock<Context>(), vi.fn());

		expect(mockS3Send).toHaveBeenCalledTimes(1);

		const recordMetadata = await getRecordMetadata("1");
		expect(recordMetadata).toBeDefined();
		expect(recordMetadata?.derivedTimestamp).toEqual(
			new Date("2023-08-20T14:15:30.000Z"),
		);
		expect(recordMetadata?.displayTime).toEqual("2023-08-20T14:15:30Z");
		expect(recordMetadata?.displayName).toEqual("test_file.jpg");
		expect(recordMetadata?.description).toEqual(null);
		expect(recordMetadata?.tags.length).toEqual(0);
		expect(recordMetadata?.altText).toEqual(null);
	});

	test("should extract timestamp from video with a single MediaInfo track object", async () => {
		const metsContent = await loadMetsFile("video_mediainfo_single_track.xml");
		mockS3Send.mockResolvedValue({
			Body: {
				transformToString: vi.fn().mockResolvedValue(metsContent),
			},
		});

		const event = {
			Records: [
				{
					messageId: "1",
					receiptHandle: "1",
					body: JSON.stringify({
						Message: JSON.stringify({
							Records: [
								{
									s3: {
										bucket: {
											name: "test-bucket",
										},
										object: {
											key: "access_copies/53f9/8c3d/a29e/4fbf/8a4a/4fd9/991e/313d/1_upload-4a64ba7c-ceac-4547-ac13-c487b2711d5a/METS.4a64ba7c-ceac-4547-ac13-c487b2711d5a.xml",
										},
									},
								},
							],
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
		};

		await handler(event, mock<Context>(), vi.fn());

		expect(mockS3Send).toHaveBeenCalledTimes(1);

		const recordMetadata = await getRecordMetadata("1");
		expect(recordMetadata).toBeDefined();
		expect(recordMetadata?.derivedTimestamp).toEqual(
			new Date("2024-05-20T08:45:00.000Z"),
		);
		expect(recordMetadata?.displayTime).toEqual("2024-05-20T08:45:00Z");
		expect(recordMetadata?.displayName).toEqual("test_file.jpg");
		expect(recordMetadata?.description).toEqual(null);
		expect(recordMetadata?.tags.length).toEqual(0);
		expect(recordMetadata?.altText).toEqual(null);
	});

	test("should handle a numeric IPTC:Caption-Abstract without failing validation", async () => {
		const metsContent = await loadMetsFile("numeric_caption_abstract.xml");
		mockS3Send.mockResolvedValue({
			Body: {
				transformToString: vi.fn().mockResolvedValue(metsContent),
			},
		});

		const event = {
			Records: [
				{
					messageId: "1",
					receiptHandle: "1",
					body: JSON.stringify({
						Message: JSON.stringify({
							Records: [
								{
									s3: {
										bucket: {
											name: "test-bucket",
										},
										object: {
											key: "access_copies/53f9/8c3d/a29e/4fbf/8a4a/4fd9/991e/313d/1_upload-4a64ba7c-ceac-4547-ac13-c487b2711d5a/METS.4a64ba7c-ceac-4547-ac13-c487b2711d5a.xml",
										},
									},
								},
							],
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
		};

		await handler(event, mock<Context>(), vi.fn());

		const recordMetadata = await getRecordMetadata("1");
		expect(recordMetadata).toBeDefined();
		expect(recordMetadata?.description).toEqual("12345");
	});

	test("should handle video with no timestamp metadata", async () => {
		const metsContent = await loadMetsFile("video_no_timestamp.xml");
		mockS3Send.mockResolvedValue({
			Body: {
				transformToString: vi.fn().mockResolvedValue(metsContent),
			},
		});

		const event = {
			Records: [
				{
					messageId: "1",
					receiptHandle: "1",
					body: JSON.stringify({
						Message: JSON.stringify({
							Records: [
								{
									s3: {
										bucket: {
											name: "test-bucket",
										},
										object: {
											key: "access_copies/53f9/8c3d/a29e/4fbf/8a4a/4fd9/991e/313d/1_upload-4a64ba7c-ceac-4547-ac13-c487b2711d5a/METS.4a64ba7c-ceac-4547-ac13-c487b2711d5a.xml",
										},
									},
								},
							],
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
		};

		await handler(event, mock<Context>(), vi.fn());

		expect(mockS3Send).toHaveBeenCalledTimes(1);

		const recordMetadata = await getRecordMetadata("1");
		expect(recordMetadata).toBeDefined();
		expect(recordMetadata?.derivedTimestamp).toEqual(null);
		expect(recordMetadata?.displayTime).toEqual(null);
		expect(recordMetadata?.displayName).toEqual("test_file.jpg");
		expect(recordMetadata?.description).toEqual(null);
		expect(recordMetadata?.tags.length).toEqual(0);
		expect(recordMetadata?.altText).toEqual(null);
	});
});
