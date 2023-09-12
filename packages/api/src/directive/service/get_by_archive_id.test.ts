import { NotFound } from "http-errors";
import { db } from "../../database";
import { directiveService } from "./index";

jest.mock("../../database");

const testDirectiveId = "39b2a5fa-3508-4030-91b6-21dc6ec7a1ab";
const testArchiveId = "1";
const testEmail = "test@permanent.org";

const loadFixtures = async (): Promise<void> => {
  await db.sql("fixtures.create_test_accounts");
  await db.sql("fixtures.create_test_archive");
  await db.sql("fixtures.create_test_account_archive");
  await db.sql("fixtures.create_test_directive");
  await db.sql("fixtures.create_test_directive_trigger");
};

const clearDatabase = async (): Promise<void> => {
  await db.query(
    "TRUNCATE account, archive, account_archive, directive, directive_trigger CASCADE"
  );
};

describe("getDirectivesByArchiveId", () => {
  beforeEach(async () => {
    await clearDatabase();
    await loadFixtures();
  });
  afterEach(async () => {
    await clearDatabase();
  });

  test("should return directive from the database", async () => {
    const response = await directiveService.getDirectivesByArchiveId(
      testArchiveId,
      testEmail
    );
    expect(response.length).toBe(1);
    expect(response[0]?.directiveId).toBe(testDirectiveId);
  });

  test("should throw not found if archive doesn't exist", async () => {
    let error = null;
    try {
      await directiveService.getDirectivesByArchiveId("9999", testEmail);
    } catch (err) {
      error = err;
    } finally {
      expect(error instanceof NotFound).toBe(true);
    }
  });

  test("should throw not found if account doesn't own archive", async () => {
    let error = null;
    try {
      await directiveService.getDirectivesByArchiveId(
        testArchiveId,
        "test+1@permanent.org"
      );
    } catch (err) {
      error = err;
    } finally {
      expect(error instanceof NotFound).toBe(true);
    }
  });

  test("should return empty list if there are no directives", async () => {
    await db.query("TRUNCATE directive, directive_trigger");
    const response = await directiveService.getDirectivesByArchiveId(
      testArchiveId,
      testEmail
    );
    expect(response.length).toBe(0);
  });
});
