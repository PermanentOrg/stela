import type { NextFunction } from "express";
import createError from "http-errors";
import { logger } from "@stela/logger";
import request from "supertest";
import { app } from "../app";
import { db } from "../database";
import {
	verifyUserAuthentication,
	extractShareTokenFromHeaders,
} from "../middleware";
import type { ArchiveFile, ArchiveRecord } from "./models";
import type { Share } from "../share/models";
import type { Tag } from "../tag/models";
import type { ShareLink } from "../share_link/models";
import {
	mockExtractShareTokenFromHeaders,
	mockExtractUserEmailFromAuthToken,
	mockVerifyUserAuthentication,
} from "../../test/middleware_mocks";

jest.mock("../database");
jest.mock("../middleware");
jest.mock("@stela/logger");

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
			profile_item CASCADE`,
	);
};

describe("GET /record", () => {
	beforeEach(async () => {
		mockExtractUserEmailFromAuthToken("test@permanent.org");
		mockExtractShareTokenFromHeaders();
		await clearDatabase();
		await setupDatabase();
	});

	afterEach(async () => {
		await clearDatabase();
		jest.restoreAllMocks();
		jest.clearAllMocks();
	});

	const agent = request(app);
	test("expect request to have an email from auth token if an auth token exists", async () => {
		mockExtractUserEmailFromAuthToken("not an email");
		await agent.get("/api/v2/record?recordIds[]=1").expect(400);
	});
	test("expect request to have a share token from the headers if such a token exists", async () => {
		mockExtractShareTokenFromHeaders("2849c711-e72e-41b5-bb49-b0b86a052668");
		await agent
			.get("/api/v2/record?recordIds[]=1")
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
			.get("/api/v2/record?recordIds[]=1")
			.expect(200);
		const { body: records } = response as { body: ArchiveRecord[] };
		expect(records.length).toEqual(1);
		expect(records[0]?.recordId).toEqual("1");
	});
	test("expect to return a record", async () => {
		const response = await agent
			.get("/api/v2/record?recordIds[]=1")
			.expect(200);
		const { body: records } = response as { body: ArchiveRecord[] };
		expect(records.length).toEqual(1);
		expect(records[0]?.recordId).toEqual("1");
	});
	test("expect to return multiple records", async () => {
		const response = await agent
			.get("/api/v2/record?recordIds[]=1&recordIds[]=2")
			.expect(200);
		const { body: records } = response as { body: ArchiveRecord[] };
		expect(records.length).toEqual(2);
	});
	test("expect an empty response if the logged-in user does not own the record", async () => {
		const response = await agent
			.get("/api/v2/record?recordIds[]=7")
			.expect(200);
		const { body: records } = response as { body: ArchiveRecord[] };
		expect(records.length).toEqual(0);
	});
	test("expect an empty response if the record is deleted", async () => {
		const response = await agent
			.get("/api/v2/record?recordIds[]=4")
			.expect(200);
		const { body: records } = response as { body: ArchiveRecord[] };
		expect(records.length).toEqual(0);
	});
	test("expect to return a public record not owned by logged-in user", async () => {
		const response = await agent
			.get("/api/v2/record?recordIds[]=5")
			.expect(200);
		const { body: records } = response as { body: ArchiveRecord[] };
		expect(records.length).toEqual(1);
		expect(records[0]?.recordId).toEqual("5");
	});
	test("expect return a public record when not logged in", async () => {
		mockExtractUserEmailFromAuthToken();
		const response = await agent
			.get("/api/v2/record?recordIds[]=1")
			.expect(200);
		const { body: records } = response as { body: ArchiveRecord[] };
		expect(records.length).toEqual(1);
		expect(records[0]?.recordId).toEqual("1");
	});
	test("expect return a private record when not logged in but providing a valid unlisted share token", async () => {
		mockExtractUserEmailFromAuthToken();
		mockExtractShareTokenFromHeaders("2849c711-e72e-41b5-bb49-b0b86a052668");
		const response = await agent
			.get("/api/v2/record?recordIds[]=2")
			.set("X-Permanent-Share-Token", "2849c711-e72e-41b5-bb49-b0b86a052668")
			.expect(200);
		const { body: records } = response as { body: ArchiveRecord[] };
		expect(records.length).toEqual(1);
		expect(records[0]?.recordId).toEqual("2");
	});
	test("expect not to return a private record when not logged in and share token provided is not unlisted", async () => {
		mockExtractUserEmailFromAuthToken();
		mockExtractShareTokenFromHeaders("17e86544-30b3-4039-9f50-56681bcf3085");
		const response = await agent
			.get("/api/v2/record?recordIds[]=2")
			.set("X-Permanent-Share-Token", "17e86544-30b3-4039-9f50-56681bcf3085")
			.expect(200);
		const { body: records } = response as { body: ArchiveRecord[] };
		expect(records.length).toEqual(0);
	});
	test("expect not to return a private record when not logged in and share token provided is expired", async () => {
		mockExtractUserEmailFromAuthToken();
		mockExtractShareTokenFromHeaders("1753eb10-ca46-4964-890b-0d4cdca1a783");
		const response = await agent
			.get("/api/v2/record?recordIds[]=2")
			.set("X-Permanent-Share-Token", "1753eb10-ca46-4964-890b-0d4cdca1a783")
			.expect(200);
		const { body: records } = response as { body: ArchiveRecord[] };
		expect(records.length).toEqual(0);
	});
	test("expect return a private record when not logged in but providing a valid share token for an ancestor folder", async () => {
		mockExtractUserEmailFromAuthToken();
		mockExtractShareTokenFromHeaders("5b23ec69-3e37-4b83-9147-acf55d4654b5");
		const response = await agent
			.get("/api/v2/record?recordIds[]=2")
			.set("X-Permanent-Share-Token", "5b23ec69-3e37-4b83-9147-acf55d4654b5")
			.expect(200);
		const { body: records } = response as { body: ArchiveRecord[] };
		expect(records.length).toEqual(1);
		expect(records[0]?.recordId).toEqual("2");
	});
	test("expect not to return a private record when share token for ancestor folder is not an unlisted share", async () => {
		mockExtractUserEmailFromAuthToken();
		mockExtractShareTokenFromHeaders("85018ca8-881e-4cb7-9a22-24f3e015f797");
		const response = await agent
			.get("/api/v2/record?recordIds[]=2")
			.set("X-Permanent-Share-Token", "85018ca8-881e-4cb7-9a22-24f3e015f797")
			.expect(200);
		const { body: records } = response as { body: ArchiveRecord[] };
		expect(records.length).toEqual(0);
	});
	test("expect not to return a private record when share token for ancestor folder is expired", async () => {
		mockExtractUserEmailFromAuthToken();
		mockExtractShareTokenFromHeaders("fbff79db-3814-4a1e-86be-ae1326cd56a3");
		const response = await agent
			.get("/api/v2/record?recordIds[]=2")
			.set("X-Permanent-Share-Token", "fbff79db-3814-4a1e-86be-ae1326cd56a3")
			.expect(200);
		const { body: records } = response as { body: ArchiveRecord[] };
		expect(records.length).toEqual(0);
	});
	test("expect not to return a private record when not logged in", async () => {
		mockExtractUserEmailFromAuthToken();
		const response = await agent
			.get("/api/v2/record?recordIds[]=2")
			.expect(200);
		const { body: records } = response as { body: ArchiveRecord[] };
		expect(records.length).toEqual(0);
	});
	test("expect to return a private record shared with the logged in account", async () => {
		// Note: Records shared directly or that are descended from a shared folder
		// will all have equivalent entries in the access table. So we don't need to
		// test that separately.
		const response = await agent
			.get("/api/v2/record?recordIds[]=6")
			.expect(200);
		const { body: records } = response as { body: ArchiveRecord[] };
		expect(records.length).toEqual(1);
		expect(records[0]?.recordId).toEqual("6");
	});
	test("expect to receive a whole record", async () => {
		const response = await agent
			.get("/api/v2/record?recordIds[]=8")
			.expect(200);
		const { body: records } = response as { body: ArchiveRecord[] };
		const [record] = records;
		expect(records.length).toEqual(1);
		expect(record?.recordId).toEqual("8");
		expect(record?.displayName).toEqual("Public File");
		expect(record?.archiveId).toEqual("1");
		expect(record?.archive.id).toEqual("1");
		expect(record?.archive.name).toEqual("Jack Rando");
		expect(record?.archiveNumber).toEqual("0000-0008");
		expect(record?.publicAt).toEqual("2023-06-21T00:00:00.000Z");
		expect(record?.description).toEqual("A description of the image");
		expect(record?.downloadName).toEqual("public_file.jpg");
		expect(record?.uploadFileName).toEqual("public_file.jpg");
		expect(record?.uploadAccountId).toEqual("2");
		expect(record?.uploadPayerAccountId).toEqual("2");
		expect(record?.size).toEqual(1024);
		expect(record?.displayDate).toEqual("2023-06-21T00:00:00.000Z");
		expect(record?.fileCreatedAt).toEqual("2023-06-21T00:00:00.000Z");
		expect(record?.imageRatio).toEqual(1);
		expect(record?.thumbUrl200).toEqual(
			"https://localcdn.permanent.org/8/thumb200.jpg",
		);
		expect(record?.thumbUrl500).toEqual(
			"https://localcdn.permanent.org/8/thumb500.jpg",
		);
		expect(record?.thumbUrl1000).toEqual(
			"https://localcdn.permanent.org/8/thumb1000.jpg",
		);
		expect(record?.thumbUrl2000).toEqual(
			"https://localcdn.permanent.org/8/thumb2000.jpg",
		);
		expect(record?.status).toEqual("status.generic.ok");
		expect(record?.type).toEqual("type.record.image");
		expect(record?.createdAt).toEqual("2023-06-21T00:00:00.000Z");
		expect(record?.updatedAt).toEqual("2023-06-21T00:00:00.000Z");
		expect(record?.altText).toEqual("An image");

		expect(record?.location?.id).toEqual("1");
		expect(record?.location?.streetNumber).toEqual("55");
		expect(record?.location?.streetName).toEqual("Rue Plumet");
		expect(record?.location?.locality).toEqual("Paris");
		expect(record?.location?.county).toEqual("Ile-de-France");
		expect(record?.location?.state).toBeNull();
		expect(record?.location?.latitude).toEqual(48.838608548520966);
		expect(record?.location?.longitude).toEqual(2.3069214988665303);
		expect(record?.location?.country).toEqual("France");
		expect(record?.location?.countryCode).toEqual("FR");
		expect(record?.location?.displayName).toEqual("Jean Valjean's House");

		expect(record?.files.length).toEqual(2);
		const originalFile = record?.files.find(
			(file: ArchiveFile) => file.fileId === "8",
		);
		const convertedFile = record?.files.find(
			(file: ArchiveFile) => file.fileId === "9",
		);
		expect(originalFile).toBeTruthy();
		expect(convertedFile).toBeTruthy();
		expect(originalFile?.size).toEqual(1024);
		expect(convertedFile?.size).toEqual(2056);
		expect(originalFile?.format).toEqual("file.format.original");
		expect(convertedFile?.format).toEqual("file.format.converted");
		expect(originalFile?.type).toEqual("type.file.image.png");
		expect(convertedFile?.type).toEqual("type.file.image.jpg");
		expect(originalFile?.fileUrl).toEqual(
			"https://localcdn.permanent.org/_Dev/8?t=1732914102&Expires=1732914102&Signature=AmCIgw__&Key-Pair-Id=APKA",
		);
		expect(originalFile?.downloadUrl).toEqual(
			"https://localcdn.permanent.org/_Dev/8?t=1732914102&response-content-disposition=attachment%3B+filename%3D%22Robert+birthday+%281%29.jpg%22&Expires=1732914102&Signature=R25~ODA0uZ77J2rjQ__&Key-Pair-Id=APKA",
		);
		expect(originalFile?.createdAt).toEqual("2023-06-21T00:00:00+00:00");
		expect(convertedFile?.createdAt).toEqual("2023-06-21T00:00:00+00:00");
		expect(originalFile?.updatedAt).toEqual("2023-06-21T00:00:00+00:00");
		expect(convertedFile?.updatedAt).toEqual("2023-06-21T00:00:00+00:00");

		expect(record?.folderLinkId).toEqual("8");
		expect(record?.folderLinkType).toEqual("type.folder_link.public");
		expect(record?.parentFolderId).toEqual("1");
		expect(record?.parentFolderLinkId).toEqual("9");
		expect(record?.parentFolderArchiveNumber).toEqual("0001-test");
		expect(record?.tags.length).toEqual(3);
		const firstTag = record?.tags.find((tag: Tag) => tag.id === "14");
		const secondTag = record?.tags.find((tag: Tag) => tag.id === "15");
		const thirdTag = record?.tags.find((tag: Tag) => tag.id === "16");
		expect(firstTag?.name).toEqual("Generic Tag 1");
		expect(secondTag?.name).toEqual("Generic Tag 2");
		expect(thirdTag?.name).toEqual("Generic Tag 3");
		expect(firstTag?.type).toEqual("type.generic.placeholder");
		expect(secondTag?.type).toEqual("type.generic.placeholder");
		expect(thirdTag?.type).toEqual("type.tag.metadata.CustomField");

		expect(record?.archiveArchiveNumber).toEqual("0001-0001");

		expect(record?.shares.length).toEqual(2);
		expect(record?.shares[0]?.id).toEqual("1");
		const shareViewer = record?.shares.find((share: Share) => share.id === "1");
		const shareContributor = record?.shares.find(
			(share: Share) => share.id === "2",
		);
		expect(shareViewer?.accessRole).toEqual("access.role.viewer");
		expect(shareViewer?.status).toEqual("status.generic.ok");
		expect(shareViewer?.archive.id).toEqual("3");
		expect(shareViewer?.archive.thumbUrl200).toEqual(
			"https://test-archive-thumbnail",
		);
		expect(shareViewer?.archive.name).toEqual("Jay Rando");

		expect(shareContributor?.accessRole).toEqual("access.role.contributor");
		expect(shareContributor?.status).toEqual("status.generic.ok");
		expect(shareContributor?.archive.id).toEqual("2");
		expect(shareContributor?.archive.thumbUrl200).toBeFalsy();
		expect(shareContributor?.archive.name).toEqual("Jane Rando");
	});
	test("expect to not return deleted files", async () => {
		const response = await agent
			.get("/api/v2/record?recordIds[]=9")
			.expect(200);
		const {
			body: [record],
		} = response as { body: ArchiveRecord[] };
		expect(record?.files.length).toEqual(1);
	});
	test("expect to not return a record in a deleted archive", async () => {
		const response = await agent
			.get("/api/v2/record?recordIds[]=10")
			.expect(200);
		const { body: records } = response as { body: ArchiveRecord[] };
		expect(records.length).toEqual(0);
	});
	test("expect to not return a record for a pending archive member", async () => {
		const response = await agent
			.get("/api/v2/record?recordIds[]=11")
			.expect(200);
		const { body: records } = response as { body: ArchiveRecord[] };
		expect(records.length).toEqual(0);
	});
	test("expect to not return a record with a deleted folder_link", async () => {
		const response = await agent
			.get("/api/v2/record?recordIds[]=12")
			.expect(200);
		const { body: records } = response as { body: ArchiveRecord[] };
		expect(records.length).toEqual(0);
	});
	test("expect to not return a record with deleted access", async () => {
		const response = await agent
			.get("/api/v2/record?recordIds[]=13")
			.expect(200);
		const { body: records } = response as { body: ArchiveRecord[] };
		expect(records.length).toEqual(0);
	});
	test("expect to not return a record shared with a deleted membership", async () => {
		mockExtractUserEmailFromAuthToken("test+2@permanent.org");
		const response = await agent
			.get("/api/v2/record?recordIds[]=2")
			.expect(200);
		const { body: records } = response as { body: ArchiveRecord[] };
		expect(records.length).toEqual(0);
	});
	test("expect to not return a record with a deleted parent folder", async () => {
		const response = await agent
			.get("/api/v2/record?recordIds[]=14")
			.expect(200);
		const { body: records } = response as { body: ArchiveRecord[] };
		expect(records.length).toEqual(0);
	});
	test("expect to log error and return 500 if database lookup fails", async () => {
		const testError = new Error("test error");
		jest.spyOn(db, "sql").mockImplementation(async () => {
			throw testError;
		});

		await agent.get("/api/v2/record?recordIds[]=14").expect(500);
		expect(logger.error).toHaveBeenCalledWith(testError);
	});
});

describe("PATCH /record", () => {
	const agent = request(app);

	beforeEach(async () => {
		mockVerifyUserAuthentication(
			"test@permanent.org",
			"b5461dc2-1eb0-450e-b710-fef7b2cafe1e",
		);
		await clearDatabase();
		await setupDatabase();
	});

	afterEach(async () => {
		await clearDatabase();
		jest.restoreAllMocks();
		jest.clearAllMocks();
	});

	test("expect an empty query to cause a 400 error", async () => {
		await agent.patch("/api/v2/record/1").send({}).expect(400);
	});

	test("expect non existent record to cause a 404 error", async () => {
		await agent
			.patch("/api/v2/record/111111111")
			.send({ description: "aa" })
			.expect(404);
	});

	test("expect request to have an email from auth token if an auth token exists", async () => {
		mockVerifyUserAuthentication(
			"not an email",
			"06a4c1dd-bee6-4fee-bcd5-419d06b936d9",
		);
		await agent.patch("/api/v2/record/1").expect(400);
	});

	test("expect location id is updated", async () => {
		await agent.patch("/api/v2/record/1").send({ locationId: 123 }).expect(200);

		const result = await db.query(
			"SELECT locnid FROM record WHERE recordId = :recordId",
			{
				recordId: 1,
			},
		);

		expect(result.rows[0]).toEqual({ locnid: "123" });
	});

	test("expect location id is updated when set to null", async () => {
		await agent
			.patch("/api/v2/record/1")
			.send({ locationId: null })
			.expect(200);

		const result = await db.query(
			"SELECT locnid FROM record WHERE recordId = :recordId",
			{
				recordId: 1,
			},
		);

		expect(result.rows[0]).toStrictEqual({ locnid: null });
	});

	test("expect 400 error if location id is wrong type", async () => {
		await agent
			.patch("/api/v2/record/1")
			.send({
				locationId: false,
			})
			.expect(400);
	});

	test("expect to log error and return 500 if database update fails", async () => {
		const testError = new Error("test error");
		jest.spyOn(db, "sql").mockImplementation(async () => {
			throw testError;
		});

		await agent.patch("/api/v2/record/1").send({ locationId: 123 }).expect(500);

		expect(logger.error).toHaveBeenCalledWith(testError);
	});

	test("expect 403 forbidden response if user doesn't have access rights", async () => {
		mockVerifyUserAuthentication(
			"test+1@permanent.org",
			"b5461dc2-1eb0-450e-b710-fef7b2cafe1e",
		);
		await agent.patch("/api/v2/record/1").send({ locationId: 123 }).expect(403);
	});

	test("expect 404 not found response if user doesn't have access rights", async () => {
		mockVerifyUserAuthentication(
			"unknown@permanent.org",
			"b5461dc2-1eb0-450e-b710-fef7b2cafe1e",
		);
		await agent.patch("/api/v2/record/1").send({ locationId: 123 }).expect(404);
	});
});

describe("GET /record/{id}/share-links", () => {
	const agent = request(app);

	beforeEach(async () => {
		mockVerifyUserAuthentication(
			"test@permanent.org",
			"b5461dc2-1eb0-450e-b710-fef7b2cafe1e",
		);
		await clearDatabase();
		await setupDatabase();
	});

	afterEach(async () => {
		await clearDatabase();
		jest.restoreAllMocks();
		jest.clearAllMocks();
	});

	test("expect to return share links for a record", async () => {
		const response = await agent
			.get("/api/v2/record/2/share-links")
			.expect(200);

		const {
			body: { items: shareLinks },
		} = response as { body: { items: ShareLink[] } };
		expect(shareLinks.length).toEqual(3);

		const shareLink = shareLinks.find((link) => link.id === "1");
		expect(shareLink?.id).toEqual("1");
		expect(shareLink?.itemId).toEqual("2");
		expect(shareLink?.itemType).toEqual("record");
		expect(shareLink?.token).toEqual("2849c711-e72e-41b5-bb49-b0b86a052668");
		expect(shareLink?.permissionsLevel).toEqual("viewer");
		expect(shareLink?.accessRestrictions).toEqual("none");
		expect(shareLink?.maxUses).toEqual(null);
		expect(shareLink?.usesExpended).toEqual(null);
		expect(shareLink?.expirationTimestamp).toEqual(null);
	});

	test("expect an empty list if record doesn't exist", async () => {
		const response = await agent
			.get("/api/v2/record/999/share-links")
			.expect(200);

		const {
			body: { items: shareLinks },
		} = response as { body: { items: ShareLink[] } };
		expect(shareLinks.length).toEqual(0);
	});

	test("expect empty list if user doesn't have access to the record's share links", async () => {
		const response = await agent
			.get("/api/v2/record/6/share-links")
			.expect(200);

		const {
			body: { items: shareLinks },
		} = response as { body: { items: ShareLink[] } };
		expect(shareLinks.length).toEqual(0);
	});

	test("expect to log error and return 500 if database lookup fails", async () => {
		const testError = new Error("test error");
		jest.spyOn(db, "sql").mockImplementation(async () => {
			throw testError;
		});

		await agent.get("/api/v2/record/1/share-links").expect(500);
		expect(logger.error).toHaveBeenCalledWith(testError);
	});

	test("expect 401 if not authenticated", async () => {
		jest
			.mocked(verifyUserAuthentication)
			.mockImplementation(async (_, __, next: NextFunction) => {
				next(createError.Unauthorized("Invalid auth token"));
			});
		await agent.get("/api/v2/record/1/share-links").expect(401);
	});

	test("expect 400 if the header values are missing", async () => {
		mockVerifyUserAuthentication();
		await agent.get("/api/v2/record/1/share-links").expect(400);
	});
});
