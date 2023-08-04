import { InternalServerError } from "http-errors";
import { db } from "../../database";
import { sendLegacyContactNotification } from "../../email";
import { logger } from "../../log";
import { legacyContactService } from "./index";
import type { LegacyContact } from "../model";

jest.mock("../../database");
jest.mock("../../email", () => ({
  sendLegacyContactNotification: jest.fn(),
}));
jest.mock("../../log", () => ({
  logger: {
    error: jest.fn(),
  },
}));

const loadFixtures = async (): Promise<void> => {
  await db.sql("fixtures.create_test_accounts");
};

const clearDatabase = async (): Promise<void> => {
  await db.query("TRUNCATE account, legacy_contact CASCADE");
};

describe("createLegacyContact", () => {
  beforeEach(async () => {
    await clearDatabase();
    await loadFixtures();
  });
  afterEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();
  });

  test("should successfully create a legacy contact", async () => {
    (
      sendLegacyContactNotification as jest.MockedFunction<
        typeof sendLegacyContactNotification
      >
    ).mockResolvedValueOnce(undefined);
    await legacyContactService.createLegacyContact({
      emailFromAuthToken: "test@permanent.org",
      name: "Legacy Contact",
      email: "legacy.contact@permanent.org",
    });

    const legacyContactResult = await db.query<LegacyContact>(
      `SELECT
        legacy_contact_id "legacyContactId",
        account_id "accountId",
        name,
        email,
        created_dt "createdDt",
        updated_dt "updatedDt"
      FROM
        legacy_contact
      WHERE
        account_id = :accountId`,
      { accountId: 2 }
    );
    expect(legacyContactResult.rows.length).toBe(1);
    expect(sendLegacyContactNotification).toHaveBeenCalledWith(
      legacyContactResult.rows[0]?.legacyContactId
    );
  });

  test("should log errors sending email", async () => {
    const testError = new Error("out of cheese error - redo from start");
    (
      sendLegacyContactNotification as jest.MockedFunction<
        typeof sendLegacyContactNotification
      >
    ).mockRejectedValueOnce(testError);
    await legacyContactService.createLegacyContact({
      emailFromAuthToken: "test@permanent.org",
      name: "Legacy Contact",
      email: "legacy.contact@permanent.org",
    });

    expect(logger.error).toHaveBeenCalledWith(testError);
  });

  test("should error if emailFromAuthToken doesn't correspond to an account", async () => {
    let error = null;
    try {
      await legacyContactService.createLegacyContact({
        emailFromAuthToken: "not_an_account@permanent.org",
        name: "Legacy Contact",
        email: "legacy.contact@permanent.org",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error instanceof InternalServerError).toBe(true);
    }
  });

  test("should error if legacy contact can't be created", async () => {
    let error = null;
    try {
      jest
        .spyOn(db, "sql")
        .mockImplementationOnce(
          (async () => ({ rows: [] } as object)) as unknown as typeof db.sql
        );
      await legacyContactService.createLegacyContact({
        emailFromAuthToken: "not_an_account@permanent.org",
        name: "Legacy Contact",
        email: "legacy.contact@permanent.org",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error instanceof InternalServerError).toBe(true);
    }
  });
});
