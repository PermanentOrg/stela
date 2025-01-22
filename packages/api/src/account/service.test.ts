import { InternalServerError } from "http-errors";
import { db } from "../database";
import { accountService } from "./service";

jest.mock("../database");

const loadFixtures = async (): Promise<void> => {
  await db.sql("account.fixtures.create_test_accounts");
  await db.sql("account.fixtures.create_test_invites");
  await db.sql("account.fixtures.create_test_archives");
  await db.sql("account.fixtures.create_test_account_archives");
};

const clearDatabase = async (): Promise<void> => {
  await db.query("TRUNCATE event, account_archive, account, archive CASCADE");
};

describe("getAccountArchive", () => {
  beforeEach(async () => {
    await clearDatabase();
    await loadFixtures();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  test("should retrieve an account_archive record if it exists", async () => {
    const accountArchive = await accountService.getAccountArchive(
      "1",
      "test@permanent.org"
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
    jest
      .spyOn(db, "sql")
      .mockRejectedValue(new Error("Out of Cheese - Redo from Start"));
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
