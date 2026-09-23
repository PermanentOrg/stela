import type { MessagesSendSuccessResponse } from "@mailchimp/mailchimp_transactional";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { app } from "../../app.js";
import { db } from "../../database.js";
import { MailchimpTransactional } from "../../mailchimp.js";
import {
	mockVerifyUserAuthentication,
	mockExtractIp,
} from "../../../test/middleware_mocks.js";
import { runFixtures } from "../../../test/run_fixtures.js";
import { mockSqlCall } from "../../../test/mock_sql.js";
import type { Archive } from "../models.js";

vi.mock("../../database");
vi.mock("../../middleware");
vi.mock("../../mailchimp");

const clearDatabase = async (): Promise<void> => {
	await db.query(
		"TRUNCATE account, archive, archive_nbr, account_archive, folder, folder_link, profile_item, invite, invite_share, share, access, event RESTART IDENTITY CASCADE",
	);
};

describe("POST /archives", () => {
	const agent = request(app);

	beforeEach(async () => {
		mockVerifyUserAuthentication(
			"newarchiveowner@permanent.org",
			"82bd483e-914b-4bfe-abf9-92ffe86d7803",
		);
		mockExtractIp("127.0.0.1");
		const mockResponse: MessagesSendSuccessResponse[] = [
			{
				email: "someone@permanent.org",
				status: "sent",
				_id: "test-id",
				reject_reason: null,
			},
		];
		vi.mocked(MailchimpTransactional.messages.sendTemplate).mockResolvedValue(
			mockResponse,
		);
		await runFixtures(db, ["archive.fixtures.create_test_accounts_for_post"]);
	});

	afterEach(async () => {
		vi.restoreAllMocks();
		await clearDatabase();
	});

	test.each(["person", "group", "organization"] as const)(
		"should create a %s archive and return it",
		async (type) => {
			const response = await agent
				.post("/api/v2/archives")
				.send({ name: "My Archive", type })
				.expect(201);

			const {
				body: { data: archive },
			} = response as { body: { data: Archive } };
			expect(archive.name).toEqual("My Archive");
			expect(archive.type).toEqual(type);
			expect(archive.public).toEqual(false);
			expect(archive.allowPublicDownload).toEqual(true);
			expect(archive.status).toEqual("ok");
			expect(archive.rootFolderId).toBeDefined();
		},
	);

	test("should default to person if type is omitted", async () => {
		const response = await agent
			.post("/api/v2/archives")
			.send({ name: "My Archive" })
			.expect(201);

		const {
			body: { data: archive },
		} = response as { body: { data: Archive } };
		expect(archive.type).toEqual("person");
	});

	test("should create the owner account_archive link", async () => {
		const response = await agent
			.post("/api/v2/archives")
			.send({ name: "My Archive", type: "person" })
			.expect(201);

		const {
			body: { data: archive },
		} = response as { body: { data: Archive } };
		const result = await db.query<{ accessrole: string }>(
			"SELECT accessrole FROM account_archive WHERE archiveid = :archiveId",
			{ archiveId: archive.archiveId },
		);
		expect(result.rows).toEqual([{ accessrole: "access.role.owner" }]);
	});

	test("should create 4 default folders", async () => {
		const response = await agent
			.post("/api/v2/archives")
			.send({ name: "My Archive", type: "person" })
			.expect(201);

		const {
			body: { data: archive },
		} = response as { body: { data: Archive } };
		const result = await db.query(
			"SELECT * FROM folder WHERE archiveid = :archiveId",
			{ archiveId: archive.archiveId },
		);
		expect(result.rows).toHaveLength(4);
	});

	test("should create an archive.create event", async () => {
		const response = await agent
			.post("/api/v2/archives")
			.send({ name: "My Archive", type: "person" })
			.expect(201);

		const {
			body: { data: archive },
		} = response as { body: { data: Archive } };
		const result = await db.query<{ entity: string; action: string }>(
			"SELECT entity, action FROM event WHERE entity_id = :archiveId",
			{ archiveId: archive.archiveId },
		);
		expect(result.rows).toEqual([{ entity: "archive", action: "create" }]);
	});

	test("should not send the acceptance email when there is no share invite", async () => {
		await agent
			.post("/api/v2/archives")
			.send({ name: "My Archive", type: "person" })
			.expect(201);

		expect(MailchimpTransactional.messages.sendTemplate).not.toHaveBeenCalled();
	});

	test("should return 400 if name is missing", async () => {
		await agent.post("/api/v2/archives").send({}).expect(400);
	});

	test("should return 400 if name is an empty string", async () => {
		await agent.post("/api/v2/archives").send({ name: "" }).expect(400);
	});

	test("should return 400 if name is only whitespace", async () => {
		await agent.post("/api/v2/archives").send({ name: "   " }).expect(400);
	});

	test("should return 400 if type is nonprofit", async () => {
		await agent
			.post("/api/v2/archives")
			.send({ name: "My Archive", type: "nonprofit" })
			.expect(400);
	});

	test("should return 500 if the authenticated email has no account", async () => {
		mockVerifyUserAuthentication(
			"noaccount@permanent.org",
			"5d1bc603-a721-4127-9c74-3a8ba4704ec5",
		);

		await agent
			.post("/api/v2/archives")
			.send({ name: "My Archive", type: "person" })
			.expect(500);

		const archiveResult = await db.query("SELECT * FROM archive");
		expect(archiveResult.rows).toHaveLength(0);
	});

	test("should return 401 if not authenticated", async () => {
		const { verifyUserAuthentication } =
			await import("../../middleware/index.js");
		vi.mocked(verifyUserAuthentication).mockImplementation(
			async (_req, _res, next) => {
				const { default: createError } = await import("http-errors");
				next(new createError.Unauthorized("Invalid token"));
			},
		);
		await agent
			.post("/api/v2/archives")
			.send({ name: "My Archive" })
			.expect(401);
	});

	describe("with a pending share invite", () => {
		beforeEach(async () => {
			await runFixtures(db, [
				"archive.fixtures.create_test_pending_share_invite",
			]);
		});

		test("should create a share, grant access, and send the acceptance email", async () => {
			const response = await agent
				.post("/api/v2/archives")
				.send({ name: "My Archive", type: "person" })
				.expect(201);

			const {
				body: { data: archive },
			} = response as { body: { data: Archive } };

			const shareResult = await db.query<{ archiveid: string }>(
				"SELECT archiveid FROM share WHERE folder_linkid = 500",
			);
			expect(shareResult.rows).toEqual([{ archiveid: archive.archiveId }]);

			const accessResult = await db.query<{ archiveid: string }>(
				"SELECT archiveid FROM access WHERE folder_linkid = 500",
			);
			expect(accessResult.rows).toEqual([{ archiveid: archive.archiveId }]);

			const inviteResult = await db.query<{ status: string }>(
				"SELECT status FROM invite WHERE inviteid = 500",
			);
			expect(inviteResult.rows[0]?.status).toEqual("status.invite.accepted");

			expect(MailchimpTransactional.messages.sendTemplate).toHaveBeenCalledWith(
				expect.objectContaining({
					template_name: "share-invitation-acceptance",
				}),
			);
		});

		test("should still return 201 if sending the acceptance email fails", async () => {
			vi.mocked(MailchimpTransactional.messages.sendTemplate).mockRejectedValue(
				new Error("mailchimp is down"),
			);

			const response = await agent
				.post("/api/v2/archives")
				.send({ name: "My Archive", type: "person" })
				.expect(201);

			const {
				body: { data: archive },
			} = response as { body: { data: Archive } };
			expect(archive.name).toEqual("My Archive");
		});
	});

	test("should return 500 and roll back everything if the event insert fails", async () => {
		mockSqlCall(
			db,
			"event.queries.create_event",
			{
				entity: "archive",
				action: "create",
				version: 1,
				actorType: "user",
				actorId: "82bd483e-914b-4bfe-abf9-92ffe86d7803",
				entityId: "1",
				ip: "127.0.0.1",
				userAgent: undefined,
				body: { name: "My Archive", type: "person" },
			},
			{ reject: new Error("test error") },
		);

		await agent
			.post("/api/v2/archives")
			.send({ name: "My Archive", type: "person" })
			.expect(500);

		const archiveResult = await db.query("SELECT * FROM archive");
		expect(archiveResult.rows).toHaveLength(0);
		const folderResult = await db.query("SELECT * FROM folder");
		expect(folderResult.rows).toHaveLength(0);
		const profileItemResult = await db.query("SELECT * FROM profile_item");
		expect(profileItemResult.rows).toHaveLength(0);
		const accountArchiveResult = await db.query(
			"SELECT * FROM account_archive",
		);
		expect(accountArchiveResult.rows).toHaveLength(0);
	});

	test("should return 500 if the archive creation query fails", async () => {
		mockSqlCall(
			db,
			"archive.queries.create_archive",
			{ archiveType: "type.archive.person" },
			{ reject: new Error("test error") },
		);

		await agent
			.post("/api/v2/archives")
			.send({ name: "My Archive", type: "person" })
			.expect(500);

		const archiveResult = await db.query("SELECT * FROM archive");
		expect(archiveResult.rows).toHaveLength(0);
	});

	test("should return 500 if the archive creation query returns 0 rows", async () => {
		mockSqlCall(
			db,
			"archive.queries.create_archive",
			{ archiveType: "type.archive.person" },
			{ resolve: { rows: [] } },
		);

		await agent
			.post("/api/v2/archives")
			.send({ name: "My Archive", type: "person" })
			.expect(500);

		const archiveResult = await db.query("SELECT * FROM archive");
		expect(archiveResult.rows).toHaveLength(0);
	});

	test("should return 500 and roll back everything if the initial profile item query fails", async () => {
		mockSqlCall(
			db,
			"archive.queries.create_initial_profile_item",
			{ archiveId: "1", name: "My Archive" },
			{ reject: new Error("test error") },
		);

		await agent
			.post("/api/v2/archives")
			.send({ name: "My Archive", type: "person" })
			.expect(500);

		const archiveResult = await db.query("SELECT * FROM archive");
		expect(archiveResult.rows).toHaveLength(0);
		const accountArchiveResult = await db.query(
			"SELECT * FROM account_archive",
		);
		expect(accountArchiveResult.rows).toHaveLength(0);
	});

	test("should return 500 and roll back everything if creating a default folder fails", async () => {
		mockSqlCall(
			db,
			"folder.queries.create_folder",
			{
				archiveId: "1",
				archiveNbr: "0000-0001",
				archivePart: "0000",
				itemPart: "0001",
				displayName: "Archive Root",
				downloadName: "Archive Root",
				description: null,
				type: "type.folder.root.root",
				publicDt: null,
				parentFolderId: null,
				parentFolderLinkId: null,
				position: 1,
				folderLinkType: "type.folder_link.root.root",
			},
			{ reject: new Error("test error") },
		);

		await agent
			.post("/api/v2/archives")
			.send({ name: "My Archive", type: "person" })
			.expect(500);

		const archiveResult = await db.query("SELECT * FROM archive");
		expect(archiveResult.rows).toHaveLength(0);
		const folderResult = await db.query("SELECT * FROM folder");
		expect(folderResult.rows).toHaveLength(0);
	});

	test("should return 500 and roll back everything if processing pending invites fails", async () => {
		mockSqlCall(
			db,
			"invite.queries.get_pending_invites_by_email",
			{ email: "newarchiveowner@permanent.org" },
			{ reject: new Error("test error") },
		);

		await agent
			.post("/api/v2/archives")
			.send({ name: "My Archive", type: "person" })
			.expect(500);

		const archiveResult = await db.query("SELECT * FROM archive");
		expect(archiveResult.rows).toHaveLength(0);
		const folderResult = await db.query("SELECT * FROM folder");
		expect(folderResult.rows).toHaveLength(0);
	});

	test("should return 500 if fetching the created archive fails after commit, even though it was already created", async () => {
		mockSqlCall(
			db,
			"archive.queries.get_archives",
			{
				archiveIds: ["1"],
				accountEmail: "newarchiveowner@permanent.org",
				pageSize: 1,
				cursor: undefined,
			},
			{ reject: new Error("test error") },
		);

		await agent
			.post("/api/v2/archives")
			.send({ name: "My Archive", type: "person" })
			.expect(500);

		const archiveResult = await db.query("SELECT * FROM archive");
		expect(archiveResult.rows).toHaveLength(1);
	});
});
