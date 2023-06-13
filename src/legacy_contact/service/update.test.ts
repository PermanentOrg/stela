import { InternalServerError, NotFound } from "http-errors";
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
  await db.sql("fixtures.create_test_legacy_contacts");
};

const clearDatabase = async (): Promise<void> => {
  await db.query("TRUNCATE account, legacy_contact CASCADE");
};

const testLegacyContactId = "0cb0738c-5607-42d0-8014-8666a8d6ba13";

describe("updateLegacyContact", () => {
  beforeEach(async () => {
    await clearDatabase();
    await loadFixtures();
  });
  afterEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();
  });

  test("should update a legacy contact's name and email", async () => {
    (
      sendLegacyContactNotification as jest.MockedFunction<
        typeof sendLegacyContactNotification
      >
    ).mockResolvedValueOnce(undefined);
    const result = await legacyContactService.updateLegacyContact(
      testLegacyContactId,
      {
        emailFromAuthToken: "test@permanent.org",
        name: "Jane Rando",
        email: "contact+1@permanent.org",
      }
    );
    expect(result.name).toEqual("Jane Rando");
    expect(result.email).toEqual("contact+1@permanent.org");

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
        legacy_contact_id = :legacyContactId`,
      { legacyContactId: testLegacyContactId }
    );
    expect(legacyContactResult.rows.length).toBe(1);
    expect(legacyContactResult.rows[0]?.name).toBe("Jane Rando");
    expect(legacyContactResult.rows[0]?.email).toBe("contact+1@permanent.org");
    expect(sendLegacyContactNotification).toHaveBeenCalledWith(
      testLegacyContactId
    );
  });

  test("should update a legacy contact's name and not email", async () => {
    const result = await legacyContactService.updateLegacyContact(
      testLegacyContactId,
      {
        emailFromAuthToken: "test@permanent.org",
        name: "Jane Rando",
      }
    );
    expect(result.name).toEqual("Jane Rando");
    expect(result.email).toEqual("contact@permanent.org");

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
        legacy_contact_id = :legacyContactId`,
      { legacyContactId: testLegacyContactId }
    );
    expect(legacyContactResult.rows.length).toBe(1);
    expect(legacyContactResult.rows[0]?.name).toBe("Jane Rando");
    expect(legacyContactResult.rows[0]?.email).toBe("contact@permanent.org");
    expect(sendLegacyContactNotification).toHaveBeenCalledTimes(0);
  });

  test("should raise not found error when legacy contact does not exist for account", async () => {
    let error = null;
    try {
      await legacyContactService.updateLegacyContact(testLegacyContactId, {
        emailFromAuthToken: "test+1@permanent.org",
        name: "Jane Rando",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error instanceof NotFound).toBe(true);
    }
  });

  test("should throw an InternalServerError when update fails unexpectedly", async () => {
    let error = null;
    try {
      jest.spyOn(db, "sql").mockImplementationOnce(async () => {
        throw new Error("Out of cheese error - redo from start");
      });
      await legacyContactService.updateLegacyContact(testLegacyContactId, {
        emailFromAuthToken: "test@permanent.org",
        name: "Jane Rando",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error instanceof InternalServerError).toBe(true);
    }
  });

  test("should log errors sending email", async () => {
    const testError = new Error("out of cheese error - redo from start");
    (
      sendLegacyContactNotification as jest.MockedFunction<
        typeof sendLegacyContactNotification
      >
    ).mockRejectedValueOnce(testError);
    await legacyContactService.updateLegacyContact(testLegacyContactId, {
      emailFromAuthToken: "test@permanent.org",
      name: "Jane Rando",
      email: "contact+1@permanent.org",
    });
    expect(logger.error).toHaveBeenCalledWith(testError);
  });
});
