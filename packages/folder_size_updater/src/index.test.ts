import type { Context, SQSEvent } from "aws-lambda";
import { mock } from "jest-mock-extended";
import { db } from "./database";
import { handler } from "./index";

jest.mock("./database");

describe("handler", () => {
	const loadFixtures = async (): Promise<void> => {
		await db.sql("fixtures.create_test_accounts");
		await db.sql("fixtures.create_test_archives");
		await db.sql("fixtures.create_test_folders");
		await db.sql("fixtures.create_test_folder_links");
		await db.sql("fixtures.create_test_folder_sizes");
		await db.sql("fixtures.create_test_records");
		await db.sql("fixtures.create_test_files");
		await db.sql("fixtures.create_test_record_files");
	};

	const clearDatabase = async (): Promise<void> => {
		await db.query(
			`TRUNCATE
				account,
				archive,
				folder,
				folder_link,
				folder_size,
				record,
				file,
				record_file
			CASCADE`,
		);
	};

	const buildSqsEvent = (
		action: string,
		recordId: string,
	): SQSEvent => ({
		Records: [
			{
				messageId: "1",
				receiptHandle: "1",
				body: JSON.stringify({
					Message: JSON.stringify({
						entity: "record",
						action,
						body:
							action === "copy"
								? { newRecord: { recordId } }
								: { record: { recordId } },
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
	});

	interface FolderSizeRow {
		myFileSizeShallow: string;
		myFileSizeDeep: string;
		myRecordCountShallow: string;
		myRecordCountDeep: string;
		allFileSizeShallow: string;
		allFileSizeDeep: string;
		allRecordCountShallow: string;
		allRecordCountDeep: string;
	}

	const getFolderSize = async (
		folderLinkId: number,
		archiveId: number,
	): Promise<FolderSizeRow | undefined> => {
		const result = await db.query<FolderSizeRow>(
			`SELECT
				myfilesizeshallow AS "myFileSizeShallow",
				myfilesizedeep AS "myFileSizeDeep",
				myrecordcountshallow AS "myRecordCountShallow",
				myrecordcountdeep AS "myRecordCountDeep",
				allfilesizeshallow AS "allFileSizeShallow",
				allfilesizedeep AS "allFileSizeDeep",
				allrecordcountshallow AS "allRecordCountShallow",
				allrecordcountdeep AS "allRecordCountDeep"
			FROM folder_size
			WHERE folder_linkid = ${folderLinkId} AND archiveid = ${archiveId}`,
		);
		return result.rows[0];
	};

	beforeEach(async () => {
		await loadFixtures();
	});

	afterEach(async () => {
		await clearDatabase();
	});

	test("should update shallow+deep on immediate parent and deep-only on ancestors for record.create", async () => {
		await handler(
			buildSqsEvent("create", "1"),
			mock<Context>(),
			jest.fn(),
		);

		const childSize = await getFolderSize(300, 1);
		const parentSize = await getFolderSize(200, 1);
		const rootSize = await getFolderSize(100, 1);

		// Child folder (immediate parent): shallow + deep updated
		expect(childSize).toEqual({
			myFileSizeShallow: "2048",
			myFileSizeDeep: "2048",
			myRecordCountShallow: "1",
			myRecordCountDeep: "1",
			allFileSizeShallow: "2048",
			allFileSizeDeep: "2048",
			allRecordCountShallow: "1",
			allRecordCountDeep: "1",
		});

		// Parent folder (ancestor): only deep updated
		expect(parentSize).toEqual({
			myFileSizeShallow: "0",
			myFileSizeDeep: "2048",
			myRecordCountShallow: "0",
			myRecordCountDeep: "1",
			allFileSizeShallow: "0",
			allFileSizeDeep: "2048",
			allRecordCountShallow: "0",
			allRecordCountDeep: "1",
		});

		// Root folder (ancestor): only deep updated
		expect(rootSize).toEqual({
			myFileSizeShallow: "0",
			myFileSizeDeep: "2048",
			myRecordCountShallow: "0",
			myRecordCountDeep: "1",
			allFileSizeShallow: "0",
			allFileSizeDeep: "2048",
			allRecordCountShallow: "0",
			allRecordCountDeep: "1",
		});
	});

	test("should update all columns but not my columns when archiveId differs", async () => {
		await handler(
			buildSqsEvent("create", "1"),
			mock<Context>(),
			jest.fn(),
		);

		// Record belongs to archive 1; this folder_size row is for archive 2
		const childSizeArch2 = await getFolderSize(300, 2);

		expect(childSizeArch2).toEqual({
			myFileSizeShallow: "0",
			myFileSizeDeep: "0",
			myRecordCountShallow: "0",
			myRecordCountDeep: "0",
			allFileSizeShallow: "2048",
			allFileSizeDeep: "2048",
			allRecordCountShallow: "1",
			allRecordCountDeep: "1",
		});
	});

	test("should correctly update folder_size for record.copy", async () => {
		await handler(
			buildSqsEvent("copy", "1"),
			mock<Context>(),
			jest.fn(),
		);

		const childSize = await getFolderSize(300, 1);

		expect(childSize).toEqual({
			myFileSizeShallow: "2048",
			myFileSizeDeep: "2048",
			myRecordCountShallow: "1",
			myRecordCountDeep: "1",
			allFileSizeShallow: "2048",
			allFileSizeDeep: "2048",
			allRecordCountShallow: "1",
			allRecordCountDeep: "1",
		});
	});

	test("should decrement folder_size for record.delete", async () => {
		// First create to set up non-zero values
		await handler(
			buildSqsEvent("create", "1"),
			mock<Context>(),
			jest.fn(),
		);

		// Then delete to decrement
		await handler(
			buildSqsEvent("delete", "1"),
			mock<Context>(),
			jest.fn(),
		);

		const childSize = await getFolderSize(300, 1);
		const parentSize = await getFolderSize(200, 1);

		expect(childSize).toEqual({
			myFileSizeShallow: "0",
			myFileSizeDeep: "0",
			myRecordCountShallow: "0",
			myRecordCountDeep: "0",
			allFileSizeShallow: "0",
			allFileSizeDeep: "0",
			allRecordCountShallow: "0",
			allRecordCountDeep: "0",
		});

		expect(parentSize).toEqual({
			myFileSizeShallow: "0",
			myFileSizeDeep: "0",
			myRecordCountShallow: "0",
			myRecordCountDeep: "0",
			allFileSizeShallow: "0",
			allFileSizeDeep: "0",
			allRecordCountShallow: "0",
			allRecordCountDeep: "0",
		});
	});

	test("should not throw for nonexistent recordId", async () => {
		let error = null;
		try {
			await handler(
				buildSqsEvent("create", "99999"),
				mock<Context>(),
				jest.fn(),
			);
		} catch (err) {
			error = err;
		}
		expect(error).toBeNull();

		// Verify nothing changed
		const childSize = await getFolderSize(300, 1);
		expect(childSize?.allFileSizeDeep).toEqual("0");
	});

	test("should throw an error if the message body is invalid", async () => {
		let error = null;
		try {
			await handler(
				{
					Records: [
						{
							messageId: "1",
							receiptHandle: "1",
							body: JSON.stringify({ fileId: "1" }),
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
		} catch (err) {
			error = err;
		}
		expect(error).toEqual(new Error("Invalid message body"));
	});

	test("should throw an error if the internal message is invalid", async () => {
		let error = null;
		try {
			await handler(
				{
					Records: [
						{
							messageId: "1",
							receiptHandle: "1",
							body: JSON.stringify({
								Message: JSON.stringify({ fileId: "1" }),
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
		} catch (err) {
			error = err;
		}
		expect(error).toEqual(new Error("Invalid message"));
	});

	test("should throw an error if record.create event is missing the record field", async () => {
		let error = null;
		try {
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
									body: { newRecord: { recordId: "1" } },
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
		} catch (err) {
			error = err;
		}
		expect(error).toEqual(
			new Error("record field missing in body of record.create"),
		);
	});

	test("should throw an error if record.copy event is missing the newRecord field", async () => {
		let error = null;
		try {
			await handler(
				{
					Records: [
						{
							messageId: "1",
							receiptHandle: "1",
							body: JSON.stringify({
								Message: JSON.stringify({
									entity: "record",
									action: "copy",
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
		} catch (err) {
			error = err;
		}
		expect(error).toEqual(
			new Error("newRecord field missing in body of record.copy"),
		);
	});

	test("should throw an error if record.delete event is missing the record field", async () => {
		let error = null;
		try {
			await handler(
				{
					Records: [
						{
							messageId: "1",
							receiptHandle: "1",
							body: JSON.stringify({
								Message: JSON.stringify({
									entity: "record",
									action: "delete",
									body: { newRecord: { recordId: "1" } },
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
		} catch (err) {
			error = err;
		}
		expect(error).toEqual(
			new Error("record field missing in body of record.delete"),
		);
	});
});
