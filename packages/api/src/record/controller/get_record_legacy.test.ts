import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { logger } from "@stela/logger";
import request from "supertest";
import { app } from "../../app";
import { db } from "../../database";
import { extractShareTokenFromHeaders } from "../../middleware";
import type { ArchiveRecord } from "../models";
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

describe("GET /record (deprecated alias, no pagination)", () => {
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
	test("expect request to have an email from auth token if an auth token exists", async () => {
		mockExtractUserEmailFromAuthToken("not an email");
		await agent.get("/api/v2/record?recordIds[]=10001").expect(400);
	});
	test("expect request to have a share token from the headers if such a token exists", async () => {
		mockExtractShareTokenFromHeaders("2849c711-e72e-41b5-bb49-b0b86a052668");
		await agent
			.get("/api/v2/record?recordIds[]=10001")
			.set("X-Permanent-Share-Token", "2849c711-e72e-41b5-bb49-b0b86a052668")
			.expect(200);
		expect(extractShareTokenFromHeaders).toHaveBeenCalled();
	});
	test("expect an empty query to cause a 400 error", async () => {
		await agent.get("/api/v2/record").expect(400);
	});
	test("expect a non-array record ID to cause a 400 error", async () => {
		await agent.get("/api/v2/record?recordIds=1").expect(400);
	});
	test("expect an empty array to cause a 400 error", async () => {
		await agent.get("/api/v2/record?recordIds[]").expect(400);
	});
	test("expect return a public record when not logged in", async () => {
		mockExtractUserEmailFromAuthToken();
		const response = await agent
			.get("/api/v2/record?recordIds[]=10001")
			.expect(200);
		const { body: records } = response as { body: ArchiveRecord[] };
		expect(records.length).toEqual(1);
		expect(records[0]?.recordId).toEqual("10001");
	});
	test("expect to return a record", async () => {
		const response = await agent
			.get("/api/v2/record?recordIds[]=10001")
			.expect(200);
		const { body: records } = response as { body: ArchiveRecord[] };
		expect(records.length).toEqual(1);
		expect(records[0]?.recordId).toEqual("10001");
	});
	test("expect to return multiple records", async () => {
		const response = await agent
			.get("/api/v2/record?recordIds[]=10001&recordIds[]=10002")
			.expect(200);
		const { body: records } = response as { body: ArchiveRecord[] };
		expect(records.length).toEqual(2);
	});
	test("expect to return multiple records in the order of the request", async () => {
		const response = await agent
			.get("/api/v2/record?recordIds[]=10002&recordIds[]=10001")
			.expect(200);
		const { body: records } = response as { body: ArchiveRecord[] };
		expect(records.length).toEqual(2);
		expect(records[0]?.recordId).toEqual("10002");
		expect(records[1]?.recordId).toEqual("10001");
	});
	test("expect an empty response if the logged-in user does not own the record", async () => {
		const response = await agent
			.get("/api/v2/record?recordIds[]=10007")
			.expect(200);
		const { body: records } = response as { body: ArchiveRecord[] };
		expect(records.length).toEqual(0);
	});
	test("expect an empty response if the record is deleted", async () => {
		const response = await agent
			.get("/api/v2/record?recordIds[]=10004")
			.expect(200);
		const { body: records } = response as { body: ArchiveRecord[] };
		expect(records.length).toEqual(0);
	});
	test("expect to return a public record not owned by logged-in user", async () => {
		const response = await agent
			.get("/api/v2/record?recordIds[]=10005")
			.expect(200);
		const { body: records } = response as { body: ArchiveRecord[] };
		expect(records.length).toEqual(1);
		expect(records[0]?.recordId).toEqual("10005");
	});
	test("expect return a public record when not logged in", async () => {
		mockExtractUserEmailFromAuthToken();
		const response = await agent
			.get("/api/v2/record?recordIds[]=10001")
			.expect(200);
		const { body: records } = response as { body: ArchiveRecord[] };
		expect(records.length).toEqual(1);
		expect(records[0]?.recordId).toEqual("10001");
	});
	test("expect return a private record when not logged in but providing a valid unlisted share token", async () => {
		mockExtractUserEmailFromAuthToken();
		mockExtractShareTokenFromHeaders("2849c711-e72e-41b5-bb49-b0b86a052668");
		const response = await agent
			.get("/api/v2/record?recordIds[]=10002")
			.set("X-Permanent-Share-Token", "2849c711-e72e-41b5-bb49-b0b86a052668")
			.expect(200);
		const { body: records } = response as { body: ArchiveRecord[] };
		expect(records.length).toEqual(1);
		expect(records[0]?.recordId).toEqual("10002");
	});
	test("expect not to return a private record when not logged in and share token provided is not unlisted", async () => {
		mockExtractUserEmailFromAuthToken();
		mockExtractShareTokenFromHeaders("17e86544-30b3-4039-9f50-56681bcf3085");
		const response = await agent
			.get("/api/v2/record?recordIds[]=10002")
			.set("X-Permanent-Share-Token", "17e86544-30b3-4039-9f50-56681bcf3085")
			.expect(200);
		const { body: records } = response as { body: ArchiveRecord[] };
		expect(records.length).toEqual(0);
	});
	test("expect not to return a private record when not logged in and share token provided is expired", async () => {
		mockExtractUserEmailFromAuthToken();
		mockExtractShareTokenFromHeaders("1753eb10-ca46-4964-890b-0d4cdca1a783");
		const response = await agent
			.get("/api/v2/record?recordIds[]=10002")
			.set("X-Permanent-Share-Token", "1753eb10-ca46-4964-890b-0d4cdca1a783")
			.expect(200);
		const { body: records } = response as { body: ArchiveRecord[] };
		expect(records.length).toEqual(0);
	});
	test("expect return a private record when not logged in but providing a valid share token for an ancestor folder", async () => {
		mockExtractUserEmailFromAuthToken();
		mockExtractShareTokenFromHeaders("5b23ec69-3e37-4b83-9147-acf55d4654b5");
		const response = await agent
			.get("/api/v2/record?recordIds[]=10002")
			.set("X-Permanent-Share-Token", "5b23ec69-3e37-4b83-9147-acf55d4654b5")
			.expect(200);
		const { body: records } = response as { body: ArchiveRecord[] };
		expect(records.length).toEqual(1);
		expect(records[0]?.recordId).toEqual("10002");
	});
	test("expect not to return a private record when share token for ancestor folder is not an unlisted share", async () => {
		mockExtractUserEmailFromAuthToken();
		mockExtractShareTokenFromHeaders("85018ca8-881e-4cb7-9a22-24f3e015f797");
		const response = await agent
			.get("/api/v2/record?recordIds[]=10002")
			.set("X-Permanent-Share-Token", "85018ca8-881e-4cb7-9a22-24f3e015f797")
			.expect(200);
		const { body: records } = response as { body: ArchiveRecord[] };
		expect(records.length).toEqual(0);
	});
	test("expect not to return a private record when share token for ancestor folder is expired", async () => {
		mockExtractUserEmailFromAuthToken();
		mockExtractShareTokenFromHeaders("fbff79db-3814-4a1e-86be-ae1326cd56a3");
		const response = await agent
			.get("/api/v2/record?recordIds[]=10002")
			.set("X-Permanent-Share-Token", "fbff79db-3814-4a1e-86be-ae1326cd56a3")
			.expect(200);
		const { body: records } = response as { body: ArchiveRecord[] };
		expect(records.length).toEqual(0);
	});
	test("expect non-manager viewer to not receive pendingShares", async () => {
		mockExtractUserEmailFromAuthToken("test+1@permanent.org");
		const response = await agent
			.get("/api/v2/record?recordIds[]=10008")
			.expect(200);
		const { body: records } = response as { body: ArchiveRecord[] };
		expect(records.length).toEqual(1);
		expect(records[0]?.pendingShares).toBeNull();
	});
	test("expect unauthenticated viewer of public record to not receive pendingShares", async () => {
		mockExtractUserEmailFromAuthToken();
		const response = await agent
			.get("/api/v2/record?recordIds[]=10008")
			.expect(200);
		const { body: records } = response as { body: ArchiveRecord[] };
		expect(records.length).toEqual(1);
		expect(records[0]?.pendingShares).toBeNull();
	});
	test("expect not to return a private record when not logged in", async () => {
		mockExtractUserEmailFromAuthToken();
		const response = await agent
			.get("/api/v2/record?recordIds[]=10002")
			.expect(200);
		const { body: records } = response as { body: ArchiveRecord[] };
		expect(records.length).toEqual(0);
	});
	test("expect to return a private record shared with the logged in account", async () => {
		// Note: Records shared directly or that are descended from a shared folder
		// will all have equivalent entries in the access table. So we don't need to
		// test that separately.
		const response = await agent
			.get("/api/v2/record?recordIds[]=10006")
			.expect(200);
		const { body: records } = response as { body: ArchiveRecord[] };
		expect(records.length).toEqual(1);
		expect(records[0]?.recordId).toEqual("10006");
	});
	test("expect to receive a whole record", async () => {
		const response = await agent
			.get("/api/v2/record?recordIds[]=10008")
			.expect(200);
		const { body: records } = response as { body: ArchiveRecord[] };
		const [record] = records;
		expect(records.length).toEqual(1);
		if (record !== undefined) {
			expect(record).toMatchObject({
				id: "10008",
				recordId: "10008",
				displayName: "Public File",
				archiveId: "1",
				archive: {
					id: "1",
					name: "Jack Rando",
				},
				archiveNumber: "0000-0008",
				publicAt: "2023-06-21T00:00:00.000Z",
				description: "A description of the image",
				downloadName: "Public File.jpg",
				uploadFileName: "public_file.jpg",
				uploadAccountId: "2",
				size: 1024,
				displayDate: "2023-06-21T00:00:00.000Z",
				fileCreatedAt: "2023-06-21T00:00:00.000Z",
				imageRatio: 1,
				thumbnailUrls: {
					"256": "https://localcdn.permanent.org/8/thumb256.jpg",
					"200": "https://localcdn.permanent.org/8/thumb200.jpg",
					"500": "https://localcdn.permanent.org/8/thumb500.jpg",
					"1000": "https://localcdn.permanent.org/8/thumb1000.jpg",
					"2000": "https://localcdn.permanent.org/8/thumb2000.jpg",
				},
				thumbUrl200: "https://localcdn.permanent.org/8/thumb200.jpg",
				thumbUrl500: "https://localcdn.permanent.org/8/thumb500.jpg",
				thumbUrl1000: "https://localcdn.permanent.org/8/thumb1000.jpg",
				thumbUrl2000: "https://localcdn.permanent.org/8/thumb2000.jpg",
				status: "status.generic.ok",
				type: "type.record.image",
				createdAt: "2023-06-21T00:00:00.000Z",
				updatedAt: "2023-06-21T00:00:00.000Z",
				altText: "An image",
				location: {
					id: "1",
					name: "Jean Valjean's House",
					sublocation: "55 Rue Plumet",
					city: "Paris",
					state: null,
					postalCode: "75007",
					country: "France",
					latitude: 48.838608548520966,
					longitude: 2.3069214988665303,
					altitudeMeters: 35.0,
					precision: "approximate",
					streetNumber: "55",
					streetName: "Rue Plumet",
					locality: "Paris",
					county: "Ile-de-France",
					countryCode: "FR",
					displayName: "Jean Valjean's House",
				},
				files: [
					{
						fileId: "10008",
						size: 1024,
						format: "file.format.original",
						type: "type.file.image.png",
						fileUrl:
							"https://localcdn.permanent.org/_Dev/8?t=1732914102&Expires=1732914102&Signature=AmCIgw__&Key-Pair-Id=APKA",
						downloadUrl:
							"https://localcdn.permanent.org/_Dev/8?t=1732914102&response-content-disposition=attachment%3B+filename%3D%22Robert+birthday+%281%29.jpg%22&Expires=1732914102&Signature=R25~ODA0uZ77J2rjQ__&Key-Pair-Id=APKA",
						createdAt: "2023-06-21T00:00:00+00:00",
						updatedAt: "2023-06-21T00:00:00+00:00",
					},
					{
						fileId: "10009",
						size: 2056,
						format: "file.format.converted",
						type: "type.file.image.jpg",
						createdAt: "2023-06-21T00:00:00+00:00",
						updatedAt: "2023-06-21T00:00:00+00:00",
					},
				],
				folderLinkId: "10008",
				folderLinkType: "type.folder_link.public",
				parentFolderId: "1",
				parentFolderLinkId: "10009",
				parentFolderArchiveNumber: "0001-test",
				tags: [
					{
						id: "14",
						name: "Generic Tag 1",
						type: "type.generic.placeholder",
					},
					{
						id: "15",
						name: "Generic Tag 2",
						type: "type.generic.placeholder",
					},
					{
						id: "16",
						name: "Generic Tag 3",
						type: "type.tag.metadata.CustomField",
					},
				],
				archiveArchiveNumber: "0001-0001",
				shares: [
					{
						id: "1",
						accessRole: "access.role.viewer",
						status: "status.generic.ok",
						archive: {
							id: "3",
							thumbUrl200: "https://test-archive-thumbnail",
							name: "Jay Rando",
						},
					},
					{
						id: "2",
						accessRole: "access.role.contributor",
						status: "status.generic.ok",
						archive: {
							id: "2",
							thumbUrl200: null,
							name: "Jane Rando",
						},
					},
				],
			});
			expect(record).toMatchObject({
				pendingShares: expect.arrayContaining([
					expect.objectContaining({
						id: "1",
						email: "pending1@example.com",
						accessRole: "access.role.viewer",
					}),
					expect.objectContaining({
						id: "2",
						email: "pending2@example.com",
						accessRole: "access.role.editor",
					}),
				]) as unknown,
			});
			expect(record.pendingShares).toHaveLength(2);
		}
	});
	test("expect to not return deleted files", async () => {
		const response = await agent
			.get("/api/v2/record?recordIds[]=10009")
			.expect(200);
		const {
			body: [record],
		} = response as { body: ArchiveRecord[] };
		expect(record?.files.length).toEqual(1);
	});
	test("expect to not return a record in a deleted archive", async () => {
		const response = await agent
			.get("/api/v2/record?recordIds[]=10010")
			.expect(200);
		const { body: records } = response as { body: ArchiveRecord[] };
		expect(records.length).toEqual(0);
	});
	test("expect to not return a record for a pending archive member", async () => {
		const response = await agent
			.get("/api/v2/record?recordIds[]=10011")
			.expect(200);
		const { body: records } = response as { body: ArchiveRecord[] };
		expect(records.length).toEqual(0);
	});
	test("expect to not return a record with a deleted folder_link", async () => {
		const response = await agent
			.get("/api/v2/record?recordIds[]=10012")
			.expect(200);
		const { body: records } = response as { body: ArchiveRecord[] };
		expect(records.length).toEqual(0);
	});
	test("expect to not return a record with deleted access", async () => {
		const response = await agent
			.get("/api/v2/record?recordIds[]=10013")
			.expect(200);
		const { body: records } = response as { body: ArchiveRecord[] };
		expect(records.length).toEqual(0);
	});
	test("expect to not return a record shared with a deleted membership", async () => {
		mockExtractUserEmailFromAuthToken("test+2@permanent.org");
		const response = await agent
			.get("/api/v2/record?recordIds[]=10002")
			.expect(200);
		const { body: records } = response as { body: ArchiveRecord[] };
		expect(records.length).toEqual(0);
	});
	test("expect to not return a record with a deleted parent folder", async () => {
		const response = await agent
			.get("/api/v2/record?recordIds[]=10014")
			.expect(200);
		const { body: records } = response as { body: ArchiveRecord[] };
		expect(records.length).toEqual(0);
	});
	test("expect to log error and return 500 if database lookup fails", async () => {
		const testError = new Error("test error");
		vi.spyOn(db, "sql").mockImplementation(async () => {
			throw testError;
		});

		await agent.get("/api/v2/record?recordIds[]=10014").expect(500);
		expect(logger.error).toHaveBeenCalledWith(testError);
	});
	test("expect to return records filtered by archiveId", async () => {
		const response = await agent.get("/api/v2/record?archiveId=1").expect(200);
		const { body: records } = response as { body: ArchiveRecord[] };
		const recordIds = records.map((record) => record.recordId);
		expect(recordIds).toHaveLength(5);
		expect(recordIds).toEqual(
			expect.arrayContaining(["10001", "10002", "10003", "10008", "10009"]),
		);
	});
	test("expect archiveId and recordIds to act as an AND filter", async () => {
		const response = await agent
			.get("/api/v2/record?archiveId=1&recordIds[]=10001")
			.expect(200);
		const { body: records } = response as { body: ArchiveRecord[] };
		expect(records.length).toEqual(1);
		expect(records[0]?.recordId).toEqual("10001");
	});
	test("expect archiveId with no matching records to return empty array", async () => {
		const response = await agent
			.get("/api/v2/record?archiveId=9999")
			.expect(200);
		const { body: records } = response as { body: ArchiveRecord[] };
		expect(records.length).toEqual(0);
	});
	test("expect archiveId for non-owned archive to return only public records", async () => {
		const response = await agent.get("/api/v2/record?archiveId=2").expect(200);
		const { body: records } = response as { body: ArchiveRecord[] };
		const recordIds = records.map((record) => record.recordId);
		expect(recordIds).toHaveLength(2);
		expect(recordIds).toEqual(expect.arrayContaining(["10005", "10006"]));
	});
	test("expect archiveId query without recordIds still requires archiveId", async () => {
		await agent.get("/api/v2/record").expect(400);
	});
	test("expect return records by archiveId for a public record when not logged in", async () => {
		mockExtractUserEmailFromAuthToken();
		const response = await agent.get("/api/v2/record?archiveId=1").expect(200);
		const { body: records } = response as { body: ArchiveRecord[] };
		const recordIds = records.map((record) => record.recordId);
		expect(recordIds).toHaveLength(2);
		expect(recordIds).toEqual(expect.arrayContaining(["10001", "10008"]));
	});
});
