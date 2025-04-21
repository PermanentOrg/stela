import { NotFound } from "http-errors";
import { db } from "../../database";
import { confirmArchiveOwnership } from "./utils";

jest.mock("../../database");

const testArchiveId = "1";
const testEmail = "test@permanent.org";

const loadFixtures = async (): Promise<void> => {
	await db.sql("directive.fixtures.create_test_accounts");
	await db.sql("directive.fixtures.create_test_archives");
	await db.sql("directive.fixtures.create_test_account_archives");
};

const clearDatabase = async (): Promise<void> => {
	await db.query("TRUNCATE account, archive, account_archive CASCADE");
};

describe("confirmArchiveOwnership", () => {
	beforeEach(async () => {
		await clearDatabase();
		await loadFixtures();
	});
	afterEach(async () => {
		await clearDatabase();
	});

	test("should not error if account owns archive", async () => {
		let error = null;
		try {
			await confirmArchiveOwnership(testArchiveId, testEmail);
		} catch (err) {
			error = err;
		} finally {
			expect(error).toBeNull();
		}
	});

	test("should return NotFound error if account doesn't own archive", async () => {
		let error = null;
		try {
			await confirmArchiveOwnership(testArchiveId, "test+1@permanent.org");
		} catch (err) {
			error = err;
		} finally {
			expect(error instanceof NotFound).toBe(true);
		}
	});

	test("should return NotFound error if archive doesn't exist", async () => {
		let error = null;
		try {
			await confirmArchiveOwnership("9999", testEmail);
		} catch (err) {
			error = err;
		} finally {
			expect(error instanceof NotFound).toBe(true);
		}
	});
});
