import { InternalServerError } from "http-errors";
import { db } from "../../database";
import { legacyContactService } from "./index";
import type { LegacyContact } from "../model";

jest.mock("../../database");

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
  });

  test("should successfully create a legacy contact", async () => {
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
