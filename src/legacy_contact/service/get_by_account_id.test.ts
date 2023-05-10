import { InternalServerError } from "http-errors";
import { db } from "../../database";
import { legacyContactService } from "./index";

jest.mock("../../database");

const loadFixtures = async (): Promise<void> => {
  await db.sql("fixtures.create_test_accounts");
  await db.sql("fixtures.create_test_legacy_contacts");
};

const clearDatabase = async (): Promise<void> => {
  await db.query("TRUNCATE account, legacy_contact CASCADE");
};

describe("getLegacyContactsByAccountId", () => {
  beforeEach(async () => {
    await clearDatabase();
    await loadFixtures();
  });
  afterEach(async () => {
    await clearDatabase();
  });

  test("should return an array of legacy contacts for a valid accountId", async () => {
    const result = await legacyContactService.getLegacyContactsByAccountId(
      "test@permanent.org"
    );

    expect(result.length).toEqual(1);
    expect(result[0]?.name).toEqual("John Rando");
    expect(result[0]?.email).toEqual("contact@permanent.org");
  });

  test("should throw an InternalServerError when retrieval of legacy contacts fails", async () => {
    let error = null;
    try {
      jest.spyOn(db, "sql").mockImplementationOnce(async () => {
        throw new Error("Out of cheese error - redo from start");
      });
      await legacyContactService.getLegacyContactsByAccountId(
        "test@permanent.org"
      );
    } catch (err) {
      error = err;
    } finally {
      expect(error instanceof InternalServerError).toBe(true);
    }
  });
});
