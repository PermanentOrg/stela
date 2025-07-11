import type { Context } from "aws-lambda";
import { mock } from "jest-mock-extended";
import { logger } from "@stela/logger";
import { constructSignedCdnUrl } from "@stela/s3-utils";
import { db } from "./database";
import { handler } from "./index";

jest.mock("./database");
jest.mock("@stela/logger");
jest.mock("@stela/s3-utils", (): unknown => ({
	...jest.requireActual("@stela/s3-utils"),
	constructSignedCdnUrl: jest.fn(),
}));

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
        record_file,
        file
      CASCADE`,
		);
	};

	beforeEach(async () => {
		await loadFixtures();
	});

	afterEach(async () => {
		await clearDatabase();
		jest.clearAllMocks();
		jest.restoreAllMocks();
	});

	test("should take no action if the file is a thumbnail", async () => {
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
										object: {
											key: "_Liam/access_copies/b38e/8582/b417/430c/953d/5c7e/8040/1ae2/2_upload-cb45fa84-f0ea-4a9e-b1da-309e485a4f4a/thumbnails/710a1def-caf8-48f2-8eee-0848b4cfda10.jpg",
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
		await handler(event, mock<Context>(), jest.fn());

		const recordThumbnail256Result = await db.query<{
			fileId: string;
		}>(
			`SELECT
        fileId
      FROM
        file
      WHERE
        parentFileId = 2`,
		);

		expect(recordThumbnail256Result.rows.length).toEqual(0);
	});

	test("should update insert a file record for the access copy", async () => {
		const testKey =
			"_Liam/access_copies/e38e/8582/b417/430c/953d/5c7e/8040/1ae2/100_upload-cb45fa84-f0ea-4a9e-b1da-309e485a4f4a/objects/710a1def-caf8-48f2-8eee-0848b4cfda10.jpg";
		const testUrl =
			"https://localcdn.permanent.org/_Liam/access_copies/e38e/8582/b417/430c/953d/5c7e/8040/1ae2/100_upload-cb45fa84-f0ea-4a9e-b1da-309e485a4f4a/objects/710a1def-caf8-48f2-8eee-0848b4cfda10.jpg?&Expires=1739554780&Signature=testSignature&Key-Pair-Id=testKeyPairId";
		const testSize = 102400;
		const testVersionId = "test-s3-version-id";

		jest.mocked(constructSignedCdnUrl).mockReturnValue(testUrl);

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
										object: {
											key: testKey,
											size: testSize,
											versionId: testVersionId,
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
		await handler(event, mock<Context>(), jest.fn());

		const fileResult = await db.query<{
			size: number;
			format: string;
			contentType: string;
			s3VersionId: string;
			archiveId: string;
			fileUrl: string;
			downloadUrl: string;
			status: string;
			type: string;
			cloudPath: string;
		}>(
			`SELECT
        size,
        format,
        contenttype AS "contentType",
        s3versionid AS "s3VersionId",
        archiveid AS "archiveId",
        fileurl AS "fileUrl",
        downloadurl AS "downloadUrl",
        status,
        type,
        cloudpath AS "cloudPath"
      FROM
        file
      WHERE
        parentFileId = :parentFileId`,
			{ parentFileId: "100" },
		);

		expect(fileResult.rows.length).toEqual(1);

		const {
			rows: [file],
		} = fileResult;
		expect(file).toBeDefined();
		if (file !== undefined) {
			expect(file.size ?? "0").toEqual(testSize.toString());
			expect(file.format).toEqual("file.format.archivematica.access");
			expect(file.contentType).toEqual("image/jpeg");
			expect(file.s3VersionId).toEqual(testVersionId);
			expect(file.archiveId).toEqual("1");
			expect(file.fileUrl).toEqual(testUrl);
			expect(file.downloadUrl).toEqual(testUrl);
			expect(file.status).toEqual("status.generic.ok");
			expect(file.type).toEqual("type.file.image.jpg");
			expect(file.cloudPath).toEqual(testKey);
		}

		expect(constructSignedCdnUrl).toHaveBeenCalledWith(testKey);
		expect(constructSignedCdnUrl).toHaveBeenCalledWith(
			testKey,
			"public_file.jpg",
		);
	});

	test("should throw an error if the original file does not exist", async () => {
		const testKey =
			"_Liam/access_copies/e38e/8582/b417/430c/953d/5c7e/8040/1ae2/200_upload-cb45fa84-f0ea-4a9e-b1da-309e485a4f4a/objects/710a1def-caf8-48f2-8eee-0848b4cfda10.jpg";
		const testSize = 102400;
		const testVersionId = "test-s3-version-id";
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
										object: {
											key: testKey,
											size: testSize,
											versionId: testVersionId,
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

		let error = null;
		try {
			await handler(event, mock<Context>(), jest.fn());
		} catch (err) {
			error = err;
		} finally {
			expect(logger.error).toHaveBeenCalledWith(
				"Failed to look up parent file",
			);
			expect(error).not.toBeNull();
		}
	});

	test("should throw an error if database call to get the original file fails", async () => {
		const testKey =
			"_Liam/access_copies/e38e/8582/b417/430c/953d/5c7e/8040/1ae2/100_upload-cb45fa84-f0ea-4a9e-b1da-309e485a4f4a/objects/710a1def-caf8-48f2-8eee-0848b4cfda10.jpg";
		const testSize = 102400;
		const testVersionId = "test-s3-version-id";
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
										object: {
											key: testKey,
											size: testSize,
											versionId: testVersionId,
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

		const testError = new Error("out of cheese - redo from start");
		jest.spyOn(db, "sql").mockRejectedValue(testError);

		let error = null;
		try {
			await handler(event, mock<Context>(), jest.fn());
		} catch (err) {
			error = err;
		} finally {
			expect(logger.error).toHaveBeenCalledWith(testError);
			expect(error).not.toBeNull();
		}
	});

	test("should throw an error if database call to insert the access file fails", async () => {
		const testKey =
			"_Liam/access_copies/e38e/8582/b417/430c/953d/5c7e/8040/1ae2/100_upload-cb45fa84-f0ea-4a9e-b1da-309e485a4f4a/objects/710a1def-caf8-48f2-8eee-0848b4cfda10.jpg";
		const testSize = 102400;
		const testVersionId = "test-s3-version-id";
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
										object: {
											key: testKey,
											size: testSize,
											versionId: testVersionId,
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

		const testError = new Error("out of cheese - redo from start");
		jest
			.spyOn(db, "sql")
			.mockResolvedValueOnce({
				command: "",
				row_count: 1,
				rows: [
					{ archiveId: "1", uploadFileName: "test_file.png", recordId: "1" },
				],
			})
			.mockRejectedValueOnce(testError);

		let error = null;
		try {
			await handler(event, mock<Context>(), jest.fn());
		} catch (err) {
			error = err;
		} finally {
			expect(logger.error).toHaveBeenCalledWith(testError);
			expect(error).not.toBeNull();
		}
	});

	test("should be idempotent", async () => {
		const testKey =
			"_Liam/access_copies/e38e/8582/b417/430c/953d/5c7e/8040/1ae2/100_upload-cb45fa84-f0ea-4a9e-b1da-309e485a4f4a/objects/710a1def-caf8-48f2-8eee-0848b4cfda10.jpg";
		const testUrl =
			"https://localcdn.permanent.org/_Liam/access_copies/e38e/8582/b417/430c/953d/5c7e/8040/1ae2/100_upload-cb45fa84-f0ea-4a9e-b1da-309e485a4f4a/objects/710a1def-caf8-48f2-8eee-0848b4cfda10.jpg?&Expires=1739554780&Signature=testSignature&Key-Pair-Id=testKeyPairId";
		const testSize = 102400;
		const testVersionId = "test-s3-version-id";

		jest.mocked(constructSignedCdnUrl).mockReturnValue(testUrl);

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
										object: {
											key: testKey,
											size: testSize,
											versionId: testVersionId,
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
		await handler(event, mock<Context>(), jest.fn());

		const fileResult = await db.query<{
			size: number;
			format: string;
			contentType: string;
			s3VersionId: string;
			archiveId: string;
			fileUrl: string;
			downloadUrl: string;
			status: string;
			type: string;
			cloudPath: string;
		}>(
			`SELECT
        size,
        format,
        contenttype AS "contentType",
        s3versionid AS "s3VersionId",
        archiveid AS "archiveId",
        fileurl AS "fileUrl",
        downloadurl AS "downloadUrl",
        status,
        type,
        cloudpath AS "cloudPath"
      FROM
        file
      WHERE
        parentFileId = :parentFileId`,
			{ parentFileId: "100" },
		);

		expect(fileResult.rows.length).toEqual(1);

		await handler(event, mock<Context>(), jest.fn());

		const fileResultAfterSecondRun = await db.query<{
			size: number;
			format: string;
			contentType: string;
			s3VersionId: string;
			archiveId: string;
			fileUrl: string;
			downloadUrl: string;
			status: string;
			type: string;
			cloudPath: string;
		}>(
			`SELECT
        size,
        format,
        contenttype AS "contentType",
        s3versionid AS "s3VersionId",
        archiveid AS "archiveId",
        fileurl AS "fileUrl",
        downloadurl AS "downloadUrl",
        status,
        type,
        cloudpath AS "cloudPath"
      FROM
        file
      WHERE
        parentFileId = :parentFileId`,
			{ parentFileId: "100" },
		);

		expect(fileResultAfterSecondRun.rows.length).toEqual(1);
	});
});
