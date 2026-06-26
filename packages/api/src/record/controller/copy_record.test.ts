import request from "supertest";
import { vi } from "vitest";
import type { NextFunction } from "express";
import { when } from "vitest-when";
import createError from "http-errors";
import { logger } from "@stela/logger";
import { app } from "../../app";
import { db } from "../../database";
import { verifyUserAuthentication } from "../../middleware";
import type { ArchiveRecord } from "../models";
import {
	mockVerifyUserAuthentication,
	mockExtractIp,
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
describe("POST /record/{recordId}/copies", () => {
	const agent = request(app);

	beforeEach(async () => {
		mockVerifyUserAuthentication(
			"test@permanent.org",
			"b5461dc2-1eb0-450e-b710-fef7b2cafe1e",
		);
		mockExtractIp("127.0.0.1");
		await clearDatabase();
		await setupDatabase();
	});

	afterEach(async () => {
		await clearDatabase();
		vi.restoreAllMocks();
		vi.resetAllMocks();
	});

	test("expect 401 if not authenticated", async () => {
		vi.mocked(verifyUserAuthentication).mockImplementation(
			async (_, __, next: NextFunction) => {
				next(createError.Unauthorized("Invalid auth token"));
			},
		);
		await agent
			.post("/api/v2/records/10008/copies")
			.send({ destinationFolderId: "2" })
			.expect(401);
	});

	test("expect 400 if destinationFolderId is missing", async () => {
		await agent.post("/api/v2/records/10008/copies").send({}).expect(400);
	});

	test("expect 404 if record does not exist", async () => {
		await agent
			.post("/api/v2/records/999999/copies")
			.send({ destinationFolderId: "2" })
			.expect(404);
	});

	test("expect 404 if destination folder does not exist", async () => {
		await agent
			.post("/api/v2/records/10008/copies")
			.send({ destinationFolderId: "999999" })
			.expect(404);
	});

	test("expect 403 if copying to another archive without owner role in source archive", async () => {
		// test+1@permanent.org is viewer in archive 1 (record 8's archive)
		// and owner in archive 2 (folder 20's archive). Cross-archive copy
		// requires owner in the source archive.
		mockVerifyUserAuthentication(
			"test+1@permanent.org",
			"553f3cb8-b753-43ce-83af-4443a404741b",
		);
		await agent
			.post("/api/v2/records/10008/copies")
			.send({ destinationFolderId: "20" })
			.expect(403);
	});

	test("expect 200 when copying to a separate archive with sufficient permissions", async () => {
		// test@permanent.org is owner in archive 1 (source) and curator in archive 5
		// (destination) via fixtures — satisfying the cross-archive copy rules.
		// Folder 34 is in archive 5.
		const response = await agent
			.post("/api/v2/records/10008/copies")
			.send({ destinationFolderId: "34" })
			.expect(200);
		const {
			body: { data: record },
		} = response as { body: { data: ArchiveRecord } };
		expect(record.archiveId).toEqual("5");
		expect(record.displayName).toEqual("Public File");
	});

	test("expect 403 if copying to public workspace without manager role", async () => {
		// test+1@permanent.org is viewer in archive 1, which is below manager.
		// Folder 1 is type.folder.public in archive 1 and requires manager role.
		mockVerifyUserAuthentication(
			"test+1@permanent.org",
			"553f3cb8-b753-43ce-83af-4443a404741b",
		);
		await agent
			.post("/api/v2/records/10008/copies")
			.send({ destinationFolderId: "1" })
			.expect(403);
	});

	test("expect 403 if user does not have curator role in destination archive", async () => {
		// test+1@permanent.org is viewer in archive 1, which is below curator.
		// Folder 2 is type.folder.private in archive 1 and requires curator role.
		mockVerifyUserAuthentication(
			"test+1@permanent.org",
			"553f3cb8-b753-43ce-83af-4443a404741b",
		);
		await agent
			.post("/api/v2/records/10008/copies")
			.send({ destinationFolderId: "2" })
			.expect(403);
	});

	test("expect 400 if not enough storage", async () => {
		await db.query(
			"UPDATE account_space SET spaceleft = 0 WHERE accountid = 2",
		);
		await agent
			.post("/api/v2/records/10008/copies")
			.send({ destinationFolderId: "2" })
			.expect(400);
	});

	test("expect 200 and return the copied record", async () => {
		const response = await agent
			.post("/api/v2/records/10008/copies")
			.send({ destinationFolderId: "1" })
			.expect(200);
		const {
			body: { data: record },
		} = response as { body: { data: ArchiveRecord } };
		expect(record.archiveId).toEqual("1");
		expect(record.displayName).toEqual("Public File");
		expect(record.downloadName).toEqual("Public File (1).jpg");
		expect(record.size).toEqual(1024);
		expect(record.archiveNumber).toEqual("0001-0005");
		expect(record.publicAt).not.toBeNull();
		expect(record.uploadPayerAccountId).toEqual("2");
		expect(record.files.length).toEqual(1);
	});

	test("expect copied record to have tags from the original, excluding deleted tag links", async () => {
		const response = await agent
			.post("/api/v2/records/10008/copies")
			.send({ destinationFolderId: "2" })
			.expect(200);
		const {
			body: { data: record },
		} = response as { body: { data: ArchiveRecord } };
		expect(record.tags).toHaveLength(3);
		expect(record.tags).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ id: "14", name: "Generic Tag 1" }),
				expect.objectContaining({ id: "15", name: "Generic Tag 2" }),
				expect.objectContaining({ id: "16", name: "Generic Tag 3" }),
			]),
		);
	});

	test("copy created in a public folder should be public", async () => {
		const response = await agent
			.post("/api/v2/records/10008/copies")
			.send({ destinationFolderId: "1" })
			.expect(200);
		const {
			body: { data: record },
		} = response as { body: { data: ArchiveRecord } };
		expect(record.publicAt).not.toBeNull();
	});

	test("copy to a private folder should produce a private record", async () => {
		const response = await agent
			.post("/api/v2/records/10008/copies")
			.send({ destinationFolderId: "2" })
			.expect(200);
		const {
			body: { data: record },
		} = response as { body: { data: ArchiveRecord } };
		expect(record.folderLinkType).toEqual("type.folder_link.private");
		expect(record.publicAt).toBeNull();
	});

	test("copy to a public folder should produce a public folder_link type", async () => {
		const response = await agent
			.post("/api/v2/records/10008/copies")
			.send({ destinationFolderId: "1" })
			.expect(200);
		const {
			body: { data: record },
		} = response as { body: { data: ArchiveRecord } };
		expect(record.folderLinkType).toEqual("type.folder_link.public");
	});

	test("copy to an app folder should produce an app folder_link type", async () => {
		const response = await agent
			.post("/api/v2/records/10008/copies")
			.send({ destinationFolderId: "30" })
			.expect(200);
		const {
			body: { data: record },
		} = response as { body: { data: ArchiveRecord } };
		expect(record.folderLinkType).toEqual("type.folder_link.app");
	});

	test("copy to a private root folder should produce a private folder_link type", async () => {
		const response = await agent
			.post("/api/v2/records/10008/copies")
			.send({ destinationFolderId: "31" })
			.expect(200);
		const {
			body: { data: record },
		} = response as { body: { data: ArchiveRecord } };
		expect(record.folderLinkType).toEqual("type.folder_link.private");
	});

	test("copy to an app root folder should produce an app folder_link type", async () => {
		const response = await agent
			.post("/api/v2/records/10008/copies")
			.send({ destinationFolderId: "32" })
			.expect(200);
		const {
			body: { data: record },
		} = response as { body: { data: ArchiveRecord } };
		expect(record.folderLinkType).toEqual("type.folder_link.app");
	});

	test("copy to a public root folder should produce a public folder_link type", async () => {
		const response = await agent
			.post("/api/v2/records/10008/copies")
			.send({ destinationFolderId: "33" })
			.expect(200);
		const {
			body: { data: record },
		} = response as { body: { data: ArchiveRecord } };
		expect(record.folderLinkType).toEqual("type.folder_link.public");
	});

	test("copy uses the archive's payer account if it is set", async () => {
		await db.query("UPDATE archive SET payeraccountid = 3 WHERE archiveid = 1");
		const response = await agent
			.post("/api/v2/records/10008/copies")
			.send({ destinationFolderId: "2" })
			.expect(200);
		const {
			body: { data: record },
		} = response as { body: { data: ArchiveRecord } };
		expect(record.uploadPayerAccountId).toEqual("3");
	});

	test("expect copy with no file extension to produce a download name without extension", async () => {
		await db.query(
			"UPDATE record SET uploadfilename = 'nodotfile', downloadname = 'nodotfile' WHERE recordid = 10008",
		);
		const response = await agent
			.post("/api/v2/records/10008/copies")
			.send({ destinationFolderId: "1" })
			.expect(200);
		const {
			body: { data: record },
		} = response as { body: { data: ArchiveRecord } };
		expect(record.downloadName).toEqual("Public File (1)");
	});

	test("expect copy to use the smallest available number when lower numbers are already in use", async () => {
		// Record 10001 is also in folder 1. With (1) already taken, the smallest
		// available number is (2).
		await db.query(
			"UPDATE record SET downloadname = 'Public File (1).jpg' WHERE recordid = 10001",
		);
		const response = await agent
			.post("/api/v2/records/10008/copies")
			.send({ destinationFolderId: "1" })
			.expect(200);
		const {
			body: { data: record },
		} = response as { body: { data: ArchiveRecord } };
		expect(record.downloadName).toEqual("Public File (2).jpg");
	});

	test("expect copy to fill a gap in the disambiguation sequence rather than appending after the maximum", async () => {
		// Numbers in use in folder 1: {1, 3}. The smallest available is (2),
		// not (4) which a max+1 strategy would produce.
		await db.query(
			"UPDATE record SET downloadname = 'Public File (1).jpg' WHERE recordid = 10001",
		);
		await db.query(
			`INSERT INTO record (recordid, archiveid, displayname, uploadaccountid, uploadpayeraccountid, uploadfilename, downloadname, status, type)
			 VALUES (29001, 1, 'Public File', 2, 2, 'public_file (3).jpg', 'Public File (3).jpg', 'status.generic.ok', 'type.record.image')`,
		);
		await db.query(
			`INSERT INTO folder_link (recordid, parentfolderid, archiveid, position, accessrole, status, type)
			 VALUES (29001, 1, 1, 3, 'access.role.owner', 'status.generic.ok', 'type.folder_link.private')`,
		);
		const response = await agent
			.post("/api/v2/records/10008/copies")
			.send({ destinationFolderId: "1" })
			.expect(200);
		const {
			body: { data: record },
		} = response as { body: { data: ArchiveRecord } };
		expect(record.downloadName).toEqual("Public File (2).jpg");
	});

	test("expect copy of a record whose download name already ends with (N) to strip the (N) when finding the base name", async () => {
		// Source has downloadName = 'Public File.jpg'. Sibling record
		// 10001 has downloadName = Public File (2).jpg
		// Copy should fill in the "gap" and take Public File (1).jpg
		await db.query(
			"UPDATE record SET downloadname = 'Public File (2).jpg' WHERE recordid = 10001",
		);
		const response = await agent
			.post("/api/v2/records/10008/copies")
			.send({ destinationFolderId: "1" })
			.expect(200);
		const {
			body: { data: record },
		} = response as { body: { data: ArchiveRecord } };
		expect(record.downloadName).toEqual("Public File (1).jpg");
	});

	test("expect parenthesized digits in the display name to be preserved verbatim in the copy's download name", async () => {
		// Disambiguation is based on downloadname, not displayname. The (2) in the
		// display name doesn't affect conflict counting and appears literally in the
		// new downloadname before the appended disambiguator.
		await db.query(
			"UPDATE record SET displayname = 'Public File (2)' WHERE recordid = 10008",
		);
		const response = await agent
			.post("/api/v2/records/10008/copies")
			.send({ destinationFolderId: "1" })
			.expect(200);
		const {
			body: { data: record },
		} = response as { body: { data: ArchiveRecord } };
		expect(record.downloadName).toEqual("Public File (2) (1).jpg");
	});

	test("expect 500 if database lookup fails", async () => {
		const testError = new Error("test error");
		vi.spyOn(db, "sql").mockImplementationOnce(async () => {
			throw testError;
		});
		await agent
			.post("/api/v2/records/10008/copies")
			.send({ destinationFolderId: "2" })
			.expect(500);
		expect(logger.error).toHaveBeenCalledWith(testError);
	});

	test("expect 500 if transaction fails", async () => {
		vi.spyOn(db, "transaction").mockRejectedValueOnce(
			new Error("Transaction error"),
		);
		await agent
			.post("/api/v2/records/10008/copies")
			.send({ destinationFolderId: "2" })
			.expect(500);
	});

	test("expect 500 if account space lookup fails", async () => {
		const testError = new Error("SQL error");
		const dbSpy = vi.spyOn(db, "sql");
		when(dbSpy)
			.calledWith("storage.queries.get_account_space_for_update", {
				email: "test@permanent.org",
			})
			.thenReject(testError);
		await agent
			.post("/api/v2/records/10008/copies")
			.send({ destinationFolderId: "2" })
			.expect(500);
		expect(logger.error).toHaveBeenCalledWith(testError);
	});

	test("expect 500 if account space lookup yields and empty response", async () => {
		const dbSpy = vi.spyOn(db, "sql");
		when(dbSpy)
			.calledWith("storage.queries.get_account_space_for_update", {
				email: "test@permanent.org",
			})
			.thenDo(vi.fn().mockResolvedValue({ rows: [] }));
		await agent
			.post("/api/v2/records/10008/copies")
			.send({ destinationFolderId: "2" })
			.expect(500);
		expect(logger.error).toHaveBeenCalledWith(
			"Empty response from account_space query",
		);
	});

	test("expect 500 if copy query fails", async () => {
		const testError = new Error("SQL error");
		const dbSpy = vi.spyOn(db, "sql");
		when(dbSpy)
			.calledWith("record.queries.copy_record", {
				destinationArchiveId: "1",
				destinationFolderId: "2",
				originalRecordId: "10008",
				callerEmail: "test@permanent.org",
				destinationIsPublic: false,
				callerIp: "127.0.0.1",
				callerUserAgent: undefined,
			})
			.thenReject(testError);
		await agent
			.post("/api/v2/records/10008/copies")
			.send({ destinationFolderId: "2" })
			.expect(500);
		expect(logger.error).toHaveBeenCalledWith(testError);
	});

	test("expect 500 if copy query yields an empty response", async () => {
		const dbSpy = vi.spyOn(db, "sql");
		when(dbSpy)
			.calledWith("record.queries.copy_record", {
				destinationArchiveId: "1",
				destinationFolderId: "2",
				originalRecordId: "10008",
				callerEmail: "test@permanent.org",
				destinationIsPublic: false,
				callerIp: "127.0.0.1",
				callerUserAgent: undefined,
			})
			.thenDo(vi.fn().mockResolvedValue({ rows: [] }));
		await agent
			.post("/api/v2/records/10008/copies")
			.send({ destinationFolderId: "2" })
			.expect(500);
		expect(logger.error).toHaveBeenCalledWith("Failed to copy record");
	});

	test("expect 500 if copy cannot be found after its creation", async () => {
		const fakeCopiedRecordId = "99999";
		const dbSpy = vi.spyOn(db, "sql");
		when(dbSpy)
			.calledWith("record.queries.copy_record", {
				destinationArchiveId: "1",
				destinationFolderId: "2",
				originalRecordId: "10008",
				callerEmail: "test@permanent.org",
				destinationIsPublic: false,
				callerIp: "127.0.0.1",
				callerUserAgent: undefined,
			})
			.thenDo(
				vi.fn().mockResolvedValue({ rows: [{ recordId: fakeCopiedRecordId }] }),
			);
		when(dbSpy)
			.calledWith("record.queries.get_records", {
				recordIds: [fakeCopiedRecordId],
				archiveId: null,
				accountEmail: "test@permanent.org",
				shareToken: undefined,
			})
			.thenDo(vi.fn().mockResolvedValue({ rows: [] }));
		await agent
			.post("/api/v2/records/10008/copies")
			.send({ destinationFolderId: "2" })
			.expect(500);
	});
});
