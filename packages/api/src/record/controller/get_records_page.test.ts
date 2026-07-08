import { logger } from "@stela/logger";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import request from "supertest";
import { app } from "../../app";
import { db } from "../../database";
import type { ArchiveRecord, GetRecordsResponse } from "../models";
import {
	mockExtractShareTokenFromHeaders,
	mockExtractUserEmailFromAuthToken,
} from "../../../test/middleware_mocks";

vi.mock("../../database");
vi.mock("../../middleware");
vi.mock("@stela/logger");

const setupDatabase = async (): Promise<void> => {
	await db.sql("record.fixtures.create_test_accounts");
	await db.sql("record.fixtures.create_test_archives");
	await db.sql("record.fixtures.create_test_account_archives");
	await db.sql("record.fixtures.create_test_locations");
	await db.sql("record.fixtures.create_test_records");
	await db.sql("record.fixtures.create_complete_test_record");
	await db.sql("record.fixtures.create_test_folders");
	await db.sql("record.fixtures.create_test_folder_links");
	await db.sql("record.fixtures.create_test_accesses");
	await db.sql("record.fixtures.create_test_files");
	await db.sql("record.fixtures.create_complete_test_files");
	await db.sql("record.fixtures.create_test_record_files");
	await db.sql("record.fixtures.create_test_tags");
	await db.sql("record.fixtures.create_test_tag_links");
	await db.sql("record.fixtures.create_test_shares");
	await db.sql("record.fixtures.create_test_profile_items");
	await db.sql("record.fixtures.create_complete_test_folder_links");
	await db.sql("record.fixtures.create_test_shareby_urls");
	await db.sql("record.fixtures.create_test_invite_shares");
	await db.sql("record.fixtures.create_test_account_space");
	await db.sql("record.fixtures.create_test_archive_nbr");
};

const clearDatabase = async (): Promise<void> => {
	await db.query(
		`TRUNCATE
			account,
			archive,
			account_archive,
			record,
			folder,
			folder_link,
			locn,
			access,
			tag,
			tag_link,
			share,
			shareby_url,
			profile_item,
			invite,
			invite_share,
			archive_nbr,
			file CASCADE`,
	);
};

describe("GET /records", () => {
	beforeEach(async () => {
		mockExtractUserEmailFromAuthToken("test@permanent.org");
		mockExtractShareTokenFromHeaders();
		await clearDatabase();
		await setupDatabase();
	});

	afterEach(async () => {
		await clearDatabase();
		vi.restoreAllMocks();
		vi.clearAllMocks();
	});

	const agent = request(app);

	test("expect a missing pageSize to cause a 400 error", async () => {
		await agent.get("/api/v2/records?archiveId=1").expect(400);
	});

	test("expect a query with neither recordIds nor archiveId to cause a 400 error", async () => {
		await agent.get("/api/v2/records?pageSize=100").expect(400);
	});

	test("expect a response with an items array and pagination metadata", async () => {
		const response = await agent
			.get("/api/v2/records?recordIds[]=10001&pageSize=100")
			.expect(200);
		const { body } = response as { body: GetRecordsResponse };
		expect(body.items).toHaveLength(1);
		expect(body.items[0]?.recordId).toEqual("10001");
		expect(body.pagination).toBeDefined();
	});

	test("expect no more than pageSize items to be returned", async () => {
		const response = await agent
			.get("/api/v2/records?archiveId=1&pageSize=2")
			.expect(200);
		const { body } = response as { body: GetRecordsResponse };
		expect(body.items).toHaveLength(2);
	});

	test("expect to page through all matching records via cursor, in ascending folderLinkId order", async () => {
		const firstResponse = await agent
			.get("/api/v2/records?archiveId=1&pageSize=2")
			.expect(200);
		const { body: firstPage } = firstResponse as { body: GetRecordsResponse };
		expect(firstPage.items.map((record) => record.recordId)).toEqual([
			"10001",
			"10002",
		]);
		expect(firstPage.pagination.totalPages).toEqual(3);
		expect(firstPage.pagination.nextCursor).toBeDefined();

		const secondResponse = await agent
			.get(
				`/api/v2/records?archiveId=1&pageSize=2&cursor=${firstPage.pagination.nextCursor}`,
			)
			.expect(200);
		const { body: secondPage } = secondResponse as { body: GetRecordsResponse };
		expect(secondPage.items.map((record) => record.recordId)).toEqual([
			"10003",
			"10008",
		]);
		expect(secondPage.pagination.totalPages).toEqual(3);

		const thirdResponse = await agent
			.get(
				`/api/v2/records?archiveId=1&pageSize=2&cursor=${secondPage.pagination.nextCursor}`,
			)
			.expect(200);
		const { body: thirdPage } = thirdResponse as { body: GetRecordsResponse };
		expect(thirdPage.items.map((record) => record.recordId)).toEqual(["10009"]);
		expect(thirdPage.pagination.totalPages).toEqual(3);
	});

	test("expect pagination.nextPage to link to the next page with the same filters", async () => {
		const response = await agent
			.get("/api/v2/records?archiveId=1&pageSize=2")
			.expect(200);
		const { body } = response as { body: GetRecordsResponse };
		expect(body.pagination.nextPage).toEqual(
			`https://${process.env["SITE_URL"] ?? ""}/api/v2/records?archiveId=1&pageSize=2&cursor=${
				body.pagination.nextCursor ?? ""
			}`,
		);
	});

	test("expect no items when querying with a cursor past the last item", async () => {
		const response = await agent
			.get("/api/v2/records?archiveId=1&pageSize=100")
			.expect(200);
		const {
			body,
			body: {
				pagination: { nextCursor },
			},
		} = response as { body: GetRecordsResponse };
		expect(body.items).toHaveLength(5);
		expect(nextCursor).toBeDefined();

		const nextResponse = await agent
			.get(`/api/v2/records?archiveId=1&pageSize=100&cursor=${nextCursor}`)
			.expect(200);
		const { body: nextBody } = nextResponse as { body: GetRecordsResponse };
		expect(nextBody.items).toHaveLength(0);
	});

	test("expect archiveId and recordIds to act as an AND filter", async () => {
		const response = await agent
			.get("/api/v2/records?archiveId=1&recordIds[]=10001&pageSize=100")
			.expect(200);
		const { body } = response as { body: GetRecordsResponse };
		expect(body.items).toHaveLength(1);
		expect(body.items[0]?.recordId).toEqual("10001");
	});

	test("expect archiveId with no matching records to return an empty items array", async () => {
		const response = await agent
			.get("/api/v2/records?archiveId=9999&pageSize=100")
			.expect(200);
		const { body } = response as { body: GetRecordsResponse };
		expect(body.items).toHaveLength(0);
		expect(body.pagination.totalPages).toEqual(0);
	});

	test("expect return a public record when not logged in", async () => {
		mockExtractUserEmailFromAuthToken();
		const response = await agent
			.get("/api/v2/records?recordIds[]=10001&pageSize=100")
			.expect(200);
		const { body } = response as { body: GetRecordsResponse };
		expect(body.items).toHaveLength(1);
		expect(body.items[0]?.recordId).toEqual("10001");
	});

	test("expect not to return a private record when not logged in", async () => {
		mockExtractUserEmailFromAuthToken();
		const response = await agent
			.get("/api/v2/records?recordIds[]=10002&pageSize=100")
			.expect(200);
		const { body } = response as { body: GetRecordsResponse };
		expect(body.items).toHaveLength(0);
	});

	test("expect return a private record when not logged in but providing a valid unlisted share token", async () => {
		mockExtractUserEmailFromAuthToken();
		mockExtractShareTokenFromHeaders("2849c711-e72e-41b5-bb49-b0b86a052668");
		const response = await agent
			.get("/api/v2/records?recordIds[]=10002&pageSize=100")
			.set("X-Permanent-Share-Token", "2849c711-e72e-41b5-bb49-b0b86a052668")
			.expect(200);
		const { body } = response as { body: GetRecordsResponse };
		expect(body.items).toHaveLength(1);
		expect(body.items[0]?.recordId).toEqual("10002");
	});

	test("expect not to return a private record when share token provided is not unlisted", async () => {
		mockExtractUserEmailFromAuthToken();
		mockExtractShareTokenFromHeaders("17e86544-30b3-4039-9f50-56681bcf3085");
		const response = await agent
			.get("/api/v2/records?recordIds[]=10002&pageSize=100")
			.set("X-Permanent-Share-Token", "17e86544-30b3-4039-9f50-56681bcf3085")
			.expect(200);
		const { body } = response as { body: GetRecordsResponse };
		expect(body.items).toHaveLength(0);
	});

	test("expect not to return a private record when share token provided is expired", async () => {
		mockExtractUserEmailFromAuthToken();
		mockExtractShareTokenFromHeaders("1753eb10-ca46-4964-890b-0d4cdca1a783");
		const response = await agent
			.get("/api/v2/records?recordIds[]=10002&pageSize=100")
			.set("X-Permanent-Share-Token", "1753eb10-ca46-4964-890b-0d4cdca1a783")
			.expect(200);
		const { body } = response as { body: GetRecordsResponse };
		expect(body.items).toHaveLength(0);
	});

	test("expect return a private record when not logged in but providing a valid share token for an ancestor folder", async () => {
		mockExtractUserEmailFromAuthToken();
		mockExtractShareTokenFromHeaders("5b23ec69-3e37-4b83-9147-acf55d4654b5");
		const response = await agent
			.get("/api/v2/records?recordIds[]=10002&pageSize=100")
			.set("X-Permanent-Share-Token", "5b23ec69-3e37-4b83-9147-acf55d4654b5")
			.expect(200);
		const { body } = response as { body: GetRecordsResponse };
		expect(body.items).toHaveLength(1);
		expect(body.items[0]?.recordId).toEqual("10002");
	});

	test("expect to return a private record shared with the logged in account", async () => {
		const response = await agent
			.get("/api/v2/records?recordIds[]=10006&pageSize=100")
			.expect(200);
		const { body } = response as { body: GetRecordsResponse };
		expect(body.items).toHaveLength(1);
		expect(body.items[0]?.recordId).toEqual("10006");
	});

	test("expect to not return a record in a deleted archive", async () => {
		const response = await agent
			.get("/api/v2/records?recordIds[]=10010&pageSize=100")
			.expect(200);
		const { body } = response as { body: GetRecordsResponse };
		expect(body.items).toHaveLength(0);
	});

	test("expect to not return a record with a deleted folder_link", async () => {
		const response = await agent
			.get("/api/v2/records?recordIds[]=10012&pageSize=100")
			.expect(200);
		const { body } = response as { body: GetRecordsResponse };
		expect(body.items).toHaveLength(0);
	});

	test("expect to not return a record with deleted access", async () => {
		const response = await agent
			.get("/api/v2/records?recordIds[]=10013&pageSize=100")
			.expect(200);
		const { body } = response as { body: GetRecordsResponse };
		expect(body.items).toHaveLength(0);
	});

	test("expect to return records filtered by archiveId for a public record when not logged in", async () => {
		mockExtractUserEmailFromAuthToken();
		const response = await agent
			.get("/api/v2/records?archiveId=1&pageSize=100")
			.expect(200);
		const { body } = response as { body: GetRecordsResponse };
		const recordIds = body.items.map(
			(record: ArchiveRecord) => record.recordId,
		);
		expect(recordIds).toHaveLength(2);
		expect(recordIds).toEqual(expect.arrayContaining(["10001", "10008"]));
	});

	test("expect to log error and return 500 if database lookup fails", async () => {
		const testError = new Error("test error");
		vi.spyOn(db, "sql").mockImplementation(async () => {
			throw testError;
		});

		await agent
			.get("/api/v2/records?recordIds[]=10001&pageSize=100")
			.expect(500);
		expect(logger.error).toHaveBeenCalledWith(testError);
	});
});
