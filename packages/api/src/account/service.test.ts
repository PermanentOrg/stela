import { InternalServerError } from "http-errors";
import { afterAll, beforeEach, describe, expect, test, vi } from "vitest";
import { db } from "../database.js";
import { accountService } from "./service.js";
import { runFixtures } from "../../test/run_fixtures.js";

vi.mock("../database");

const loadFixtures = async (): Promise<void> => {
	await runFixtures(db, [
		"account.fixtures.create_test_accounts",
		"account.fixtures.create_test_invites",
		"account.fixtures.create_test_archives",
		"account.fixtures.create_test_account_archives",
	]);
};

const clearDatabase = async (): Promise<void> => {
	await db.query("TRUNCATE event, account_archive, account, archive CASCADE");
};

describe("getAccountArchive", () => {
	beforeEach(async () => {
		await clearDatabase();
		await loadFixtures();
	});

	afterAll(async () => {
		await clearDatabase();
	});

	test("should retrieve an account_archive record if it exists", async () => {
		const accountArchive = await accountService.getAccountArchive(
			"1",
			"test@permanent.org",
		);
		expect(accountArchive).toEqual({
			accountArchiveId: "3",
			accountId: "2",
			accessRole: "access.role.owner",
			type: "type.account.standard",
			status: "status.generic.ok",
		});
	});

	test("should throw an internal server error if the database call fails", async () => {
		vi.spyOn(db, "sql").mockRejectedValue(
			new Error("Out of Cheese - Redo from Start"),
		);
		let error = null;
		try {
			await accountService.getAccountArchive("1", "test@permanent.org");
		} catch (err) {
			error = err;
		} finally {
			expect(error).toBeInstanceOf(InternalServerError);
		}
	});
});
