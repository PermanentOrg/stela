import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { logger } from "@stela/logger";
import request from "supertest";
import { app } from "../../app.js";
import { db } from "../../database.js";
import type { ArchiveRecord } from "../models.js";
import {
	mockExtractShareTokenFromHeaders,
	mockExtractUserEmailFromAuthToken,
} from "../../../test/middleware_mocks.js";

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

describe("GET /records/:recordId", () => {
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
		await agent.get("/api/v2/record/10001").expect(400);
	});
	test("expect to receive a whole record", async () => {
		const response = await agent.get("/api/v2/record/10008").expect(200);
		const {
			body: { data: record },
		} = response as { body: { data: ArchiveRecord } };
		expect(record).toMatchObject({
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
					name: "Carol Zhang",
					accessRole: "access.role.viewer",
				}),
				expect.objectContaining({
					id: "2",
					email: "pending2@example.com",
					name: "Juan Sotos",
					accessRole: "access.role.editor",
				}),
			]) as unknown,
		});
		expect(record.pendingShares).toHaveLength(2);
	});
	test("expect to log error and return 500 if database lookup fails", async () => {
		const testError = new Error("test error");
		vi.spyOn(db, "sql").mockImplementation(async () => {
			throw testError;
		});

		await agent.get("/api/v2/record/10014").expect(500);
		expect(logger.error).toHaveBeenCalledWith(testError);
	});
});
