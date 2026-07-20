import request from "supertest";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { when } from "vitest-when";

import { db } from "../../database.js";
import { EVENT_ACTION, EVENT_ACTOR, EVENT_ENTITY } from "../../constants.js";
import { app } from "../../app.js";
import { createEvent } from "../../event/service.js";
import {
	mockVerifyUserAuthentication,
	mockExtractIp,
} from "../../../test/middleware_mocks.js";

vi.mock("../../database");
vi.mock("../../middleware");
vi.mock("../../event/service");

const loadFixtures = async (): Promise<void> => {
	await db.sql("account.fixtures.create_test_accounts");
	await db.sql("account.fixtures.create_test_archives");
	await db.sql("account.fixtures.create_test_account_archives");
};

const clearDatabase = async (): Promise<void> => {
	await db.query("TRUNCATE event, account_archive, account, archive CASCADE");
};

describe("leaveArchive", () => {
	const agent = request(app);

	const ip = "127.0.0.1";
	const selectEventRow = `
      SELECT * FROM event e
      WHERE e.entity = '${EVENT_ENTITY.AccountArchive}'
        AND e.version = 1
        AND e.entity_id = '5'
        AND e.action = '${EVENT_ACTION.Delete}'
        AND e.ip = '${ip}'
        AND e.actor_type = '${EVENT_ACTOR.User}'
        AND e.actor_id = 'b5461dc2-1eb0-450e-b710-fef7b2cafe1e'`;

	const selectAccountArchiveRow = `SELECT * FROM account_archive WHERE
        accountid = 3 AND archiveid = 1`;

	beforeEach(async () => {
		vi.resetAllMocks();
		mockVerifyUserAuthentication(
			"test+1@permanent.org",
			"b5461dc2-1eb0-450e-b710-fef7b2cafe1e",
		);
		mockExtractIp(ip);
		await loadFixtures();
	});

	afterEach(async () => {
		await clearDatabase();
	});

	test("should successfully leave an archive", async () => {
		const accountArchiveBeforeLeaveResult = await db.query(
			selectAccountArchiveRow,
		);

		expect(accountArchiveBeforeLeaveResult.rows.length).toBe(1);

		await agent.delete("/api/v2/accounts/archive/1").expect(204);

		const accountArchiveAfterLeaveResult = await db.query(
			selectAccountArchiveRow,
		);

		expect(accountArchiveAfterLeaveResult.rows.length).toBe(0);
	});

	test("should throw 404 error if account archive relationship is not found", async () => {
		await agent.delete("/api/v2/accounts/archive/2022").expect(404);
	});

	test("should throw 400 error if the account owns the archive", async () => {
		await agent.delete("/api/v2/accounts/archive/2").expect(400);
	});

	test("should log an event", async () => {
		const eventsBeforeLeave = await db.query(selectEventRow);
		expect(eventsBeforeLeave.rows.length).toBe(0);

		await agent.delete("/api/v2/accounts/archive/1").expect(204);

		expect(createEvent).toHaveBeenCalled();
	});

	test("should return a bad request error if the request is invalid", async () => {
		mockVerifyUserAuthentication("test+1@permanent.org");
		await agent.delete("/api/v2/accounts/archive/1").expect(400);
	});

	test("should return a 500 error if the deletion database call fails", async () => {
		const spy = vi.spyOn(db, "sql");
		when(spy)
			.calledWith("account.queries.delete_account_archive", {
				archiveId: "1",
				email: "test+1@permanent.org",
			})
			.thenDo(vi.fn().mockResolvedValue({ rows: [] }));
		await agent.delete("/api/v2/accounts/archive/1").expect(500);
	});
});
