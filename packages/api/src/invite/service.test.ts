import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { db } from "../database.js";
import { runFixtures } from "../../test/run_fixtures.js";
import { mockSqlCall } from "../../test/mock_sql.js";
import { processPendingInvites } from "./service.js";

vi.mock("../database");

const loadFixtures = async (): Promise<void> => {
	await runFixtures(db, [
		"invite.fixtures.create_test_accounts",
		"invite.fixtures.create_test_archives",
		"invite.fixtures.create_test_folders",
		"invite.fixtures.create_test_records",
		"invite.fixtures.create_test_folder_links",
		"invite.fixtures.create_test_invites",
	]);
};

const clearDatabase = async (): Promise<void> => {
	await db.query(
		"TRUNCATE account, archive, folder, record, folder_link, invite, invite_share, share, access CASCADE",
	);
};

describe("processPendingInvites", () => {
	beforeEach(async () => {
		await loadFixtures();
	});

	afterEach(async () => {
		await clearDatabase();
	});

	test("should create a share row for the pending invite share", async () => {
		await processPendingInvites("newaccount@permanent.org", "2", db);

		const result = await db.query<{
			folder_linkid: string;
			archiveid: string;
			accessrole: string;
			status: string;
			type: string;
		}>("SELECT folder_linkid, archiveid, accessrole, status, type FROM share");
		expect(result.rows).toEqual([
			{
				folder_linkid: "1",
				archiveid: "2",
				accessrole: "access.role.viewer",
				status: "status.generic.ok",
				type: "type.share.folder",
			},
		]);
	});

	test("should grant recursive access to the shared folder_link and its descendants", async () => {
		await processPendingInvites("newaccount@permanent.org", "2", db);

		const result = await db.query<{
			folder_linkid: string;
			archiveid: string;
			accessrole: string;
		}>(
			"SELECT folder_linkid, archiveid, accessrole FROM access ORDER BY folder_linkid",
		);
		expect(result.rows).toEqual([
			{ folder_linkid: "1", archiveid: "2", accessrole: "access.role.viewer" },
			{ folder_linkid: "2", archiveid: "2", accessrole: "access.role.viewer" },
		]);
	});

	test("should return the ids of the invites it accepted", async () => {
		const acceptedInviteIds = await processPendingInvites(
			"newaccount@permanent.org",
			"2",
			db,
		);

		expect(acceptedInviteIds).toEqual(["1", "7"]);
	});

	test("should not create duplicate share or access rows when two invites name the same folder_link", async () => {
		await processPendingInvites("newaccount@permanent.org", "2", db);

		const shareResult = await db.query(
			"SELECT * FROM share WHERE folder_linkid = 1",
		);
		expect(shareResult.rows).toHaveLength(1);

		const accessResult = await db.query(
			"SELECT * FROM access WHERE folder_linkid = 1",
		);
		expect(accessResult.rows).toHaveLength(1);

		const inviteResult = await db.query<{ status: string }>(
			"SELECT status FROM invite WHERE inviteid = 7",
		);
		expect(inviteResult.rows[0]?.status).toEqual("status.invite.accepted");
	});

	test("should not consume a pending invite of a different type", async () => {
		await processPendingInvites("newaccount@permanent.org", "2", db);

		const inviteResult = await db.query<{ status: string }>(
			"SELECT status FROM invite WHERE inviteid = 5",
		);
		expect(inviteResult.rows[0]?.status).toEqual("status.invite.pending");
	});

	test("should match the invite email case-insensitively", async () => {
		const acceptedInviteIds = await processPendingInvites(
			"mixedCASE@permanent.org",
			"2",
			db,
		);

		expect(acceptedInviteIds).toEqual(["6"]);
		const inviteResult = await db.query<{ status: string }>(
			"SELECT status FROM invite WHERE inviteid = 6",
		);
		expect(inviteResult.rows[0]?.status).toEqual("status.invite.accepted");
	});

	test("should accept an invite_share with an unrecognized access role without granting anything", async () => {
		await processPendingInvites("mixedcase@permanent.org", "2", db);

		const inviteShareResult = await db.query<{ status: string }>(
			"SELECT status FROM invite_share WHERE invite_shareid = 5",
		);
		expect(inviteShareResult.rows[0]?.status).toEqual("status.invite.accepted");

		const shareResult = await db.query("SELECT * FROM share");
		expect(shareResult.rows).toHaveLength(0);

		const accessResult = await db.query("SELECT * FROM access");
		expect(accessResult.rows).toHaveLength(0);
	});

	test("should mark the invite_share and invite accepted", async () => {
		await processPendingInvites("newaccount@permanent.org", "2", db);

		const inviteShareResult = await db.query<{ status: string }>(
			"SELECT status FROM invite_share WHERE invite_shareid = 1",
		);
		expect(inviteShareResult.rows[0]?.status).toEqual("status.invite.accepted");

		const inviteResult = await db.query<{ status: string }>(
			"SELECT status FROM invite WHERE inviteid = 1",
		);
		expect(inviteResult.rows[0]?.status).toEqual("status.invite.accepted");
	});

	test("should not touch a revoked invite", async () => {
		await processPendingInvites("newaccount@permanent.org", "2", db);

		const inviteResult = await db.query<{ status: string }>(
			"SELECT status FROM invite WHERE inviteid = 2",
		);
		expect(inviteResult.rows[0]?.status).toEqual("status.invite.revoked");
	});

	test("should do nothing for an email with no pending invites", async () => {
		const acceptedInviteIds = await processPendingInvites(
			"nobody@permanent.org",
			"2",
			db,
		);

		expect(acceptedInviteIds).toEqual([]);
		const shareResult = await db.query("SELECT * FROM share");
		expect(shareResult.rows).toHaveLength(0);
	});

	test("should mark an invite_share with NULL folder_linkid/accessrole as accepted without creating a share or access grant", async () => {
		await processPendingInvites("nullfields@permanent.org", "2", db);

		const inviteShareResult = await db.query<{ status: string }>(
			"SELECT status FROM invite_share WHERE invite_shareid = 3",
		);
		expect(inviteShareResult.rows[0]?.status).toEqual("status.invite.accepted");

		const inviteResult = await db.query<{ status: string }>(
			"SELECT status FROM invite WHERE inviteid = 3",
		);
		expect(inviteResult.rows[0]?.status).toEqual("status.invite.accepted");

		const shareResult = await db.query("SELECT * FROM share");
		expect(shareResult.rows).toHaveLength(0);

		const accessResult = await db.query("SELECT * FROM access");
		expect(accessResult.rows).toHaveLength(0);
	});

	test("should create a record-typed share for a record-backed folder_link", async () => {
		await processPendingInvites("recordshare@permanent.org", "2", db);

		const result = await db.query<{ type: string }>(
			"SELECT type FROM share WHERE folder_linkid = 3",
		);
		expect(result.rows[0]?.type).toEqual("type.share.record");
	});

	test("should throw if looking up pending invites fails", async () => {
		mockSqlCall(
			db,
			"invite.queries.get_pending_invites_by_email",
			{ email: "newaccount@permanent.org" },
			{ reject: new Error("test error") },
		);

		await expect(
			processPendingInvites("newaccount@permanent.org", "2", db),
		).rejects.toThrow("Failed to look up pending invites");
	});

	test("should throw if creating the share fails", async () => {
		mockSqlCall(
			db,
			"invite.queries.create_share",
			{
				folderLinkIds: ["1"],
				accessRoles: ["access.role.viewer"],
				archiveId: "2",
			},
			{ reject: new Error("test error") },
		);

		await expect(
			processPendingInvites("newaccount@permanent.org", "2", db),
		).rejects.toThrow("Failed to create share");
	});

	test("should throw if granting recursive access fails", async () => {
		mockSqlCall(
			db,
			"invite.queries.create_access_grants_recursive",
			{
				folderLinkIds: ["1"],
				accessRoles: ["access.role.viewer"],
				archiveId: "2",
			},
			{ reject: new Error("test error") },
		);

		await expect(
			processPendingInvites("newaccount@permanent.org", "2", db),
		).rejects.toThrow("Failed to grant access to shared folder");
	});

	test("should throw if updating invite_share status fails", async () => {
		mockSqlCall(
			db,
			"invite.queries.update_invite_share_status",
			{ inviteShareIds: ["1", "6"], status: "status.invite.accepted" },
			{ reject: new Error("test error") },
		);

		await expect(
			processPendingInvites("newaccount@permanent.org", "2", db),
		).rejects.toThrow("Failed to update invite share status");
	});

	test("should throw if updating invite status fails", async () => {
		mockSqlCall(
			db,
			"invite.queries.update_invite_status",
			{ inviteIds: ["1", "7"], status: "status.invite.accepted" },
			{ reject: new Error("test error") },
		);

		await expect(
			processPendingInvites("newaccount@permanent.org", "2", db),
		).rejects.toThrow("Failed to update invite status");
	});
});
