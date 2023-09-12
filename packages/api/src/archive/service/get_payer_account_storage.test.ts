import { InternalServerError, NotFound } from "http-errors";
import { logger } from "@stela/logger";
import { db } from "../../database";
import { archiveService } from "./index";

jest.mock("../../database");
jest.mock("@stela/logger", () => ({
  logger: {
    error: jest.fn(),
  },
}));

const loadFixtures = async (): Promise<void> => {
  await db.sql("fixtures.create_test_accounts");
  await db.sql("fixtures.create_test_archive");
  await db.sql("fixtures.create_test_account_archive");
  await db.sql("fixtures.create_test_account_space");
};

const clearDatabase = async (): Promise<void> => {
  await db.query(
    "TRUNCATE account, archive, account_archive, account_space CASCADE"
  );
};

describe("getPayerAccountStorage", () => {
  beforeEach(async () => {
    await clearDatabase();
    await loadFixtures();
  });
  afterEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();
  });

  test("should return payer account storage", async () => {
    const payerAccountStorage = await archiveService.getPayerAccountStorage(
      "1",
      "test+1@permanent.org"
    );
    expect(payerAccountStorage.accountId).toEqual("2");
    expect(payerAccountStorage.spaceLeft).toEqual("104723522");
  });

  test("should throw a not found error if account can't access the archive", async () => {
    let error = null;
    try {
      await archiveService.getPayerAccountStorage("1", "test+2@permanent.org");
    } catch (err) {
      error = err;
    } finally {
      expect(error instanceof NotFound).toEqual(true);
    }
  });

  test("should throw a not found error if archive has no payer account", async () => {
    let error = null;
    try {
      await archiveService.getPayerAccountStorage("2", "test+1@permanent.org");
    } catch (err) {
      error = err;
    } finally {
      expect(error instanceof NotFound).toEqual(true);
    }
  });

  test("should throw an internal server error if database call fails", async () => {
    let error = null;
    const testError = new Error("out of cheese - redo from start");
    try {
      jest.spyOn(db, "sql").mockRejectedValueOnce(testError);
      await archiveService.getPayerAccountStorage("1", "test+1@permanent.org");
    } catch (err) {
      error = err;
    } finally {
      expect(error instanceof InternalServerError).toEqual(true);
      expect(logger.error).toHaveBeenCalledWith(testError);
    }
  });
});
