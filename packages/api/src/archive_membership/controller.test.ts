import request from "supertest";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { NextFunction } from "express";
import createError from "http-errors";
import { app } from "../app.js";
import { verifyUserAuthentication } from "../middleware/index.js";
import { db } from "../database.js";
import type { ArchiveMembership } from "./models.js";
import {
	mockExtractIp,
	mockVerifyUserAuthentication,
} from "../../test/middleware_mocks.js";
import { mockSqlCall } from "../../test/mock_sql.js";

vi.mock("../database");
vi.mock("../middleware");

const loadFixtures = async (): Promise<void> => {
	await db.sql("archive_membership.fixtures.create_test_accounts");
	await db.sql("archive_membership.fixtures.create_test_archives");
	await db.sql("archive_membership.fixtures.create_test_profile_items");
	await db.sql("archive_membership.fixtures.create_test_account_archives");
};

const clearDatabase = async (): Promise<void> => {
	await db.query(
		"TRUNCATE account, archive, profile_item, account_archive, event CASCADE",
	);
};

describe("PATCH /archive-memberships/:id", () => {
	const agent = request(app);

	beforeEach(async () => {
		mockVerifyUserAuthentication(
			"test@permanent.org",
			"315aedc2-67d5-4144-9f0d-ee547d98af9c",
		);
		mockExtractIp("0.0.0.0");
		await loadFixtures();
	});

	afterEach(async () => {
		vi.restoreAllMocks();
		vi.resetAllMocks();
		await clearDatabase();
	});

	test("should return 200 for a valid accessRole update by owner", async () => {
		await agent
			.patch("/api/v2/archive-memberships/2")
			.send({ accessRole: "contributor" })
			.expect(200);
	});

	test("should return the updated membership with new accessRole", async () => {
		const response = await agent
			.patch("/api/v2/archive-memberships/2")
			.send({ accessRole: "contributor" })
			.expect(200);

		const {
			body: { data: membership },
		} = response as { body: { data: ArchiveMembership } };
		expect(membership.id).toEqual("2");
		expect(membership.accountId).toEqual("2");
		expect(membership.accessRole).toEqual("contributor");
		expect(membership.status).toEqual("pending");
		expect(membership.archive.id).toEqual("1");
		expect(membership.archive.name).toEqual("Test Archive");
		expect(membership.archive.thumbnailUrls).toEqual({
			width200: null,
			width500: null,
			width1000: null,
			width2000: null,
		});
	});

	test("should allow the member to set their own status to 'ok'", async () => {
		mockVerifyUserAuthentication(
			"test+1@permanent.org",
			"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
		);
		const response = await agent
			.patch("/api/v2/archive-memberships/2")
			.send({ status: "ok" })
			.expect(200);

		const {
			body: { data: membership },
		} = response as { body: { data: ArchiveMembership } };
		expect(membership.status).toEqual("ok");
	});

	test("should return 400 if status is set to 'deleted'", async () => {
		mockVerifyUserAuthentication(
			"test+1@permanent.org",
			"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
		);
		await agent
			.patch("/api/v2/archive-memberships/2")
			.send({ status: "deleted" })
			.expect(400);
	});

	test("should return 404 if a pending member tries to update another user's membership", async () => {
		mockVerifyUserAuthentication(
			"test+1@permanent.org",
			"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
		);
		await agent
			.patch("/api/v2/archive-memberships/1")
			.send({ accessRole: "contributor" })
			.expect(404);
	});

	test("should return 403 if a non-manager tries to update accessRole", async () => {
		mockVerifyUserAuthentication(
			"test+3@permanent.org",
			"dddddddd-dddd-dddd-dddd-dddddddddddd",
		);
		await agent
			.patch("/api/v2/archive-memberships/2")
			.send({ accessRole: "contributor" })
			.expect(403);
	});

	test("should return 404 if a non-member tries to update", async () => {
		mockVerifyUserAuthentication(
			"test+2@permanent.org",
			"cccccccc-cccc-cccc-cccc-cccccccccccc",
		);
		await agent
			.patch("/api/v2/archive-memberships/2")
			.send({ accessRole: "contributor" })
			.expect(404);
	});

	test("should return 404 if the archive membership is deleted", async () => {
		await agent
			.patch("/api/v2/archive-memberships/4")
			.send({ accessRole: "contributor" })
			.expect(404);
	});

	test("should return 403 if owner tries to set another member's status to 'ok'", async () => {
		await agent
			.patch("/api/v2/archive-memberships/2")
			.send({ status: "ok" })
			.expect(403);
	});

	test("should return 403 if trying to set the access role of an owner membership", async () => {
		await agent
			.patch("/api/v2/archive-memberships/1")
			.send({ accessRole: "manager" })
			.expect(403);
	});

	test("should return 401 if the caller is not authenticated", async () => {
		vi.mocked(verifyUserAuthentication).mockImplementation(
			async (_, __, next: NextFunction) => {
				next(new createError.Unauthorized("Invalid token"));
			},
		);
		await agent
			.patch("/api/v2/archive-memberships/2")
			.send({ accessRole: "contributor" })
			.expect(401);
	});

	test("should return 400 if the request body is empty", async () => {
		await agent.patch("/api/v2/archive-memberships/2").send({}).expect(400);
	});

	test("should return 400 if accessRole is invalid", async () => {
		await agent
			.patch("/api/v2/archive-memberships/2")
			.send({ accessRole: "superadmin" })
			.expect(400);
	});

	test("should return 400 if status is invalid", async () => {
		await agent
			.patch("/api/v2/archive-memberships/2")
			.send({ status: "pending" })
			.expect(400);
	});

	test("should return 400 if accessRole is 'owner'", async () => {
		await agent
			.patch("/api/v2/archive-memberships/2")
			.send({ accessRole: "owner" })
			.expect(400);
	});

	test("should return 404 if the membership does not exist", async () => {
		await agent
			.patch("/api/v2/archive-memberships/9999")
			.send({ accessRole: "contributor" })
			.expect(404);
	});

	test("should return 500 if the archive membership permissions data call fails", async () => {
		vi.spyOn(db, "sql").mockRejectedValue(new Error("Test error"));
		await agent
			.patch("/api/v2/archive-memberships/2")
			.send({ accessRole: "contributor" })
			.expect(500);
	});

	test("should return 500 if the archive access role call fails", async () => {
		mockSqlCall(
			db,
			"access.queries.get_archive_access_role",
			{ archiveId: "1", email: "test@permanent.org" },
			{ reject: new Error("Test error") },
		);
		await agent
			.patch("/api/v2/archive-memberships/2")
			.send({ accessRole: "contributor" })
			.expect(500);
	});

	test("should return 500 if the update query fails", async () => {
		mockSqlCall(
			db,
			"archive_membership.queries.update_archive_membership",
			{ id: "2", accessRole: "access.role.contributor", status: null },
			{ reject: new Error("Test error") },
		);
		await agent
			.patch("/api/v2/archive-memberships/2")
			.send({ accessRole: "contributor" })
			.expect(500);
	});

	test("should return 404 if the update query updates 0 rows", async () => {
		mockSqlCall(
			db,
			"archive_membership.queries.update_archive_membership",
			{ id: "2", accessRole: "access.role.contributor", status: null },
			{ resolve: { rows: [] } },
		);
		await agent
			.patch("/api/v2/archive-memberships/2")
			.send({ accessRole: "contributor" })
			.expect(404);
	});

	test("should return 500 if the post-update get query fails", async () => {
		mockSqlCall(
			db,
			"archive_membership.queries.get_archive_membership",
			{ id: "2" },
			{ reject: new Error("Test error") },
		);
		await agent
			.patch("/api/v2/archive-memberships/2")
			.send({ accessRole: "contributor" })
			.expect(500);
	});

	test("should return 500 if the post-update get query returns 0 rows", async () => {
		mockSqlCall(
			db,
			"archive_membership.queries.get_archive_membership",
			{ id: "2" },
			{ resolve: { rows: [] } },
		);
		await agent
			.patch("/api/v2/archive-memberships/2")
			.send({ accessRole: "contributor" })
			.expect(500);
	});

	test("should return 500 if the post-update get query returns more than 1 row", async () => {
		mockSqlCall(
			db,
			"archive_membership.queries.get_archive_membership",
			{ id: "2" },
			{ resolve: { rows: [{}, {}] } },
		);
		await agent
			.patch("/api/v2/archive-memberships/2")
			.send({ accessRole: "contributor" })
			.expect(500);
	});

	test("should return 500 if the post-update get query returns an archive membership with a null archive name", async () => {
		mockSqlCall(
			db,
			"archive_membership.queries.get_archive_membership",
			{ id: "2" },
			{ resolve: { rows: [{ archive: { name: null } }] } },
		);
		await agent
			.patch("/api/v2/archive-memberships/2")
			.send({ accessRole: "contributor" })
			.expect(500);
	});

	test("should return 500 and roll back if event insertion fails", async () => {
		mockSqlCall(
			db,
			"event.queries.create_event",
			{
				entity: "archive_membership",
				action: "update",
				version: 1,
				actorType: "user",
				actorId: "315aedc2-67d5-4144-9f0d-ee547d98af9c",
				entityId: "2",
				ip: "0.0.0.0",
				userAgent: undefined,
				body: { newAccessRole: "contributor", newStatus: undefined },
			},
			{ reject: new Error("test error") },
		);
		await agent
			.patch("/api/v2/archive-memberships/2")
			.send({ accessRole: "contributor" })
			.expect(500);

		const archiveMembershipResult = await db.query<{ accessRole: string }>(
			'SELECT accessrole AS "accessRole" FROM account_archive WHERE account_archiveid = 2',
		);
		expect(archiveMembershipResult.rows[0]?.accessRole).toEqual(
			"access.role.viewer",
		);
	});
});

describe("DELETE /archive-memberships/:id", () => {
	const agent = request(app);

	beforeEach(async () => {
		mockVerifyUserAuthentication(
			"test@permanent.org",
			"315aedc2-67d5-4144-9f0d-ee547d98af9c",
		);
		mockExtractIp("0.0.0.0");
		await loadFixtures();
	});

	afterEach(async () => {
		vi.restoreAllMocks();
		vi.resetAllMocks();
		await clearDatabase();
	});

	test("should return 204 when a member deletes their own membership", async () => {
		mockVerifyUserAuthentication(
			"test+1@permanent.org",
			"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
		);
		await agent.delete("/api/v2/archive-memberships/2").expect(204);
	});

	test("should hard delete the membership row from the database", async () => {
		mockVerifyUserAuthentication(
			"test+1@permanent.org",
			"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
		);
		await agent.delete("/api/v2/archive-memberships/2").expect(204);

		const result = await db.query(
			"SELECT * FROM account_archive WHERE account_archiveid = 2",
		);
		expect(result.rows).toHaveLength(0);
	});

	test("should allow a manager or owner to delete another member's non-owner membership", async () => {
		await agent.delete("/api/v2/archive-memberships/2").expect(204);

		const result = await db.query(
			"SELECT * FROM account_archive WHERE account_archiveid = 2",
		);
		expect(result.rows).toHaveLength(0);
	});

	test("should create an archive_membership.delete event containing the entire deleted row", async () => {
		await agent.delete("/api/v2/archive-memberships/2").expect(204);

		const eventResult = await db.query<{
			entity: string;
			action: string;
			version: number;
			entityId: string;
			body: Record<string, unknown>;
		}>(
			`SELECT
				entity,
				action,
				version,
				entity_id AS "entityId",
				body
			FROM event
			WHERE entity = 'archive_membership' AND action = 'delete'`,
		);
		expect(eventResult.rows).toHaveLength(1);
		const {
			rows: [event],
		} = eventResult;
		expect(event?.version).toEqual(1);
		expect(event?.entityId).toEqual("2");
		expect(event?.body["deletedArchiveMembership"]).toEqual({
			id: "2",
			accountId: "2",
			archiveId: "1",
			accessRole: "access.role.viewer",
			position: "0",
			type: "type.account.standard",
			status: "status.generic.pending",
			createdAt: expect.any(String) as unknown,
			updatedAt: expect.any(String) as unknown,
		});
	});

	test("should return 400 if the request body is missing fields", async () => {
		mockVerifyUserAuthentication("dddddddd-dddd-dddd-dddd-dddddddddddd");
		await agent.delete("/api/v2/archive-memberships/2").expect(400);
	});

	test("should return 403 if a non-manager tries to delete another member's membership", async () => {
		mockVerifyUserAuthentication(
			"test+3@permanent.org",
			"dddddddd-dddd-dddd-dddd-dddddddddddd",
		);
		await agent.delete("/api/v2/archive-memberships/2").expect(403);
	});

	test("should return 404 if a non-member tries to delete another member's membership", async () => {
		mockVerifyUserAuthentication(
			"test+2@permanent.org",
			"cccccccc-cccc-cccc-cccc-cccccccccccc",
		);
		await agent.delete("/api/v2/archive-memberships/2").expect(404);
	});

	test("should return 403 if trying to delete an owner-level membership", async () => {
		await agent.delete("/api/v2/archive-memberships/1").expect(403);
	});

	test("should return 404 if the membership does not exist", async () => {
		await agent.delete("/api/v2/archive-memberships/9999").expect(404);
	});

	test("should return 404 if the membership is already deleted", async () => {
		await agent.delete("/api/v2/archive-memberships/4").expect(404);
	});

	test("should return 401 if the caller is not authenticated", async () => {
		vi.mocked(verifyUserAuthentication).mockImplementation(
			async (_, __, next: NextFunction) => {
				next(new createError.Unauthorized("Invalid token"));
			},
		);
		await agent.delete("/api/v2/archive-memberships/2").expect(401);
	});

	test("should return 500 if the archive membership permissions data call fails", async () => {
		vi.spyOn(db, "sql").mockRejectedValue(new Error("Test error"));
		await agent.delete("/api/v2/archive-memberships/2").expect(500);
	});

	test("should return 500 if the archive access role call fails", async () => {
		mockSqlCall(
			db,
			"access.queries.get_archive_access_role",
			{ archiveId: "1", email: "test@permanent.org" },
			{ reject: new Error("Test error") },
		);
		await agent.delete("/api/v2/archive-memberships/2").expect(500);
	});

	test("should return 500 if the delete query fails", async () => {
		mockSqlCall(
			db,
			"archive_membership.queries.delete_archive_membership",
			{ id: "2" },
			{ reject: new Error("Test error") },
		);
		await agent.delete("/api/v2/archive-memberships/2").expect(500);
	});

	test("should return 404 if the delete query deletes 0 rows", async () => {
		mockSqlCall(
			db,
			"archive_membership.queries.delete_archive_membership",
			{ id: "2" },
			{ resolve: { rows: [] } },
		);
		await agent.delete("/api/v2/archive-memberships/2").expect(404);
	});

	test("should return 500 and roll back if event insertion fails", async () => {
		mockSqlCall(
			db,
			"event.queries.create_event",
			{
				entity: "archive_membership",
				action: "delete",
				version: 1,
				actorType: "user",
				actorId: "315aedc2-67d5-4144-9f0d-ee547d98af9c",
				entityId: "2",
				ip: "0.0.0.0",
				userAgent: undefined,
				body: {
					deletedArchiveMembership: {
						id: "2",
						accountId: "2",
						archiveId: "1",
						accessRole: "access.role.viewer",
						position: "0",
						type: "type.account.standard",
						status: "status.generic.pending",
						createdAt: expect.any(Date) as unknown,
						updatedAt: expect.any(Date) as unknown,
					},
				},
			},
			{ reject: new Error("test error") },
		);
		await agent.delete("/api/v2/archive-memberships/2").expect(500);

		const result = await db.query(
			"SELECT * FROM account_archive WHERE account_archiveid = 2",
		);
		expect(result.rows).toHaveLength(1);
	});
});
