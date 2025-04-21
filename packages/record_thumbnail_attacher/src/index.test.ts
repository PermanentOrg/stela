import type { Context } from "aws-lambda";
import { constructSignedCdnUrl } from "@stela/s3-utils";
import { logger } from "@stela/logger";
import { db } from "./database";
import { handler } from "./index";

jest.mock("./database");
jest.mock("@stela/s3-utils", (): unknown => ({
	...jest.requireActual("@stela/s3-utils"),
	constructSignedCdnUrl: jest.fn(),
}));
jest.mock("@stela/logger");

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
        record_file
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

	test("should take no action if the file isn't a thumbnail", async () => {
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
											key: "_Liam/access_copies/b38e/8582/b417/430c/953d/5c7e/8040/1ae2/2_upload-cb45fa84-f0ea-4a9e-b1da-309e485a4f4a/object/710a1def-caf8-48f2-8eee-0848b4cfda10.jpg",
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
		await handler(event, {} as Context, () => {});

		const recordThumbnail256Result = await db.query<{
			thumbnail256: string;
		}>(
			`SELECT
        thumbnail256
      FROM
        record
      WHERE
        recordId = :recordId`,
			{ recordId: "1" },
		);

		expect(recordThumbnail256Result.rows.length).toEqual(1);
		expect(recordThumbnail256Result.rows[0]?.thumbnail256).toEqual(null);
	});

	test("should throw an error if file key is missing", async () => {
		const event = {
			Records: [
				{
					messageId: "1",
					receiptHandle: "1",
					body: JSON.stringify({}),
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
			await handler(event, {} as Context, () => {});
		} catch (err) {
			error = err;
		}
		expect(error).toEqual(new Error("Invalid message body"));
	});

	test("should throw an error if file key is missing in one of multiple events", async () => {
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
											key: "_Liam/access_copies/e38e/8582/b417/430c/953d/5c7e/8040/1ae2/2_upload-cb45fa84-f0ea-4a9e-b1da-309e485a4f4a/object/710a1def-caf8-48f2-8eee-0848b4cfda10.jpg",
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
					messageId: "1",
					receiptHandle: "1",
					body: JSON.stringify({}),
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
			await handler(event, {} as Context, () => {});
		} catch (err) {
			error = err;
		}
		expect(error).toEqual(new Error("Invalid message body"));
	});

	test("should error if file ID can't be extracted from the key", async () => {
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
											key: "_Liam/access_copies/e38e/8582/b417/430c/953d/5c7e/8040/1ae2/thumbnails/2_load-cb45fa84-f0ea-4a9e-b1da-309e485a4f4a/object/710a1def-caf8-48f2-8eee-0848b4cfda10.jpg",
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
			await handler(event, {} as Context, () => {});
		} catch (err) {
			error = err;
		}
		expect(error).toEqual(new Error("Invalid file key"));
	});

	test("should update the record's thumbnail256 fields", async () => {
		const testKey =
			"_Liam/access_copies/e38e/8582/b417/430c/953d/5c7e/8040/1ae2/1_upload-cb45fa84-f0ea-4a9e-b1da-309e485a4f4a/thumbnails/710a1def-caf8-48f2-8eee-0848b4cfda10.jpg";
		const testUrl =
			"https://localcdn.permanent.org/_Liam/access_copies/e38e/8582/b417/430c/953d/5c7e/8040/1ae2/1_upload-cb45fa84-f0ea-4a9e-b1da-309e485a4f4a/thumbnails/710a1def-caf8-48f2-8eee-0848b4cfda10.jpg?&Expires=1739554780&Signature=testSignature&Key-Pair-Id=testKeyPairId";

		(constructSignedCdnUrl as jest.Mock).mockReturnValue(testUrl);

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
		await handler(event, {} as Context, () => {});

		const recordThumbnail256Result = await db.query<{
			thumbnail256: string;
			thumbnail256CloudPath: string;
			thumbDt: string;
			updatedDt: string;
		}>(
			`SELECT
        thumbnail256,
        thumbnail256cloudpath AS "thumbnail256CloudPath",
        thumbdt AS "thumbDt",
        updateddt AS "updatedDt"
      FROM
        record
      WHERE
        recordId = :recordId`,
			{ recordId: "1" },
		);

		expect(recordThumbnail256Result.rows.length).toEqual(1);
		expect(recordThumbnail256Result.rows[0]?.thumbnail256).toEqual(testUrl);
		expect(recordThumbnail256Result.rows[0]?.thumbnail256CloudPath).toEqual(
			testKey,
		);

		const oneDayAgo = new Date();
		oneDayAgo.setDate(oneDayAgo.getDate() - 1);
		expect(
			Date.parse(recordThumbnail256Result.rows[0]?.updatedDt ?? "") >
				oneDayAgo.getTime(),
		).toBe(true);

		const oneYearFromNowMinusOneDay = new Date();
		oneYearFromNowMinusOneDay.setFullYear(
			oneYearFromNowMinusOneDay.getFullYear() + 1,
		);
		oneYearFromNowMinusOneDay.setDate(oneYearFromNowMinusOneDay.getDate() - 1);

		expect(
			Date.parse(recordThumbnail256Result.rows[0]?.thumbDt ?? "") >
				oneYearFromNowMinusOneDay.getTime(),
		).toBe(true);
	});

	test("should not update thumbdt if it is less than one year away", async () => {
		const testKey =
			"_Liam/access_copies/e38e/8582/b417/430c/953d/5c7e/8040/1ae2/1_upload-cb45fa84-f0ea-4a9e-b1da-309e485a4f4a/thumbnails/710a1def-caf8-48f2-8eee-0848b4cfda10.jpg";
		const testUrl =
			"https://localcdn.permanent.org/_Liam/access_copies/e38e/8582/b417/430c/953d/5c7e/8040/1ae2/1_upload-cb45fa84-f0ea-4a9e-b1da-309e485a4f4a/thumbnails/710a1def-caf8-48f2-8eee-0848b4cfda10.jpg?&Expires=1739554780&Signature=testSignature&Key-Pair-Id=testKeyPairId";

		(constructSignedCdnUrl as jest.Mock).mockReturnValue(testUrl);

		const oneWeekFromNow = new Date();
		oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
		await db.query(
			`UPDATE
        record
      SET
        thumbdt = :thumbDt
      WHERE
        recordId = :recordId`,
			{ thumbDt: oneWeekFromNow.toISOString(), recordId: "1" },
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
										object: {
											key: testKey,
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
		await handler(event, {} as Context, () => {});

		const recordThumbnail256Result = await db.query<{
			thumbDt: string;
		}>(
			`SELECT
        thumbdt AS "thumbDt"
      FROM
        record
      WHERE
        recordId = :recordId`,
			{ recordId: "1" },
		);
		const oneYearFromNowMinusOneDay = new Date();
		oneYearFromNowMinusOneDay.setFullYear(
			oneYearFromNowMinusOneDay.getFullYear() + 1,
		);
		oneYearFromNowMinusOneDay.setDate(oneYearFromNowMinusOneDay.getDate() - 1);

		expect(
			Date.parse(recordThumbnail256Result.rows[0]?.thumbDt ?? "") >
				oneYearFromNowMinusOneDay.getTime(),
		).toBe(false);
	});

	test("should log an error if the database call fails", async () => {
		const testKey =
			"_Liam/access_copies/e38e/8582/b417/430c/953d/5c7e/8040/1ae2/1_upload-cb45fa84-f0ea-4a9e-b1da-309e485a4f4a/thumbnails/710a1def-caf8-48f2-8eee-0848b4cfda10.jpg";
		const testUrl =
			"https://localcdn.permanent.org/_Liam/access_copies/e38e/8582/b417/430c/953d/5c7e/8040/1ae2/1_upload-cb45fa84-f0ea-4a9e-b1da-309e485a4f4a/thumbnails/710a1def-caf8-48f2-8eee-0848b4cfda10.jpg?&Expires=1739554780&Signature=testSignature&Key-Pair-Id=testKeyPairId";

		(constructSignedCdnUrl as jest.Mock).mockReturnValue(testUrl);

		const dbError = new Error("Database error");
		jest.spyOn(db, "sql").mockRejectedValue(dbError);

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
		try {
			await handler(event, {} as Context, () => {});
		} catch (err) {
			// Do nothing
		}

		expect(logger.error).toHaveBeenCalledWith(dbError);
	});
});
