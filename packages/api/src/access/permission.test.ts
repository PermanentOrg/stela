import createError from "http-errors";
import {
  getRecordAccessRole,
  getFolderAccessRole,
  isItemPublic,
} from "./permission";
import { AccessRole } from "./models";
import { db } from "../database";

jest.mock("../database");

const loadFixtures = async (): Promise<void> => {
  await db.sql("access.fixtures.create_test_accounts");
  await db.sql("access.fixtures.create_test_archives");
  await db.sql("access.fixtures.create_test_account_archives");
  await db.sql("access.fixtures.create_test_records");
  await db.sql("access.fixtures.create_test_folders");
  await db.sql("access.fixtures.create_test_accesses");
  await db.sql("access.fixtures.create_test_folder_links");
};

const clearDatabase = async (): Promise<void> => {
  await db.query(
    "TRUNCATE account, archive, account_archive, record, folder, access, folder_link CASCADE"
  );
};

describe("getRecordAccessRole", () => {
  beforeEach(async () => {
    await clearDatabase();
    await loadFixtures();
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await clearDatabase();
  });

  test("should get access role from account_archive", async () => {
    const accessLevel = await getRecordAccessRole("1", "test@permanent.org");
    expect(accessLevel).toEqual(AccessRole.Owner);
  });

  test("should throw a not found error if account has no access to record", async () => {
    let error = null;
    try {
      await getRecordAccessRole("2", "test@permanent.org");
    } catch (err) {
      error = err;
    } finally {
      expect(error).toEqual(createError.NotFound());
    }
  });

  test("should get access role from access entry (i.e., a share)", async () => {
    const accessLevel = await getRecordAccessRole("3", "test@permanent.org");
    expect(accessLevel).toEqual(AccessRole.Viewer);
  });

  test("should use the more permissive access role, if access exists from both a share and an archive membership", async () => {
    const accessLevel = await getRecordAccessRole("4", "test@permanent.org");
    expect(accessLevel).toEqual(AccessRole.Manager);
  });

  test("should ignore deleted account_archives", async () => {
    let error = null;
    try {
      await getRecordAccessRole("5", "test@permanent.org");
    } catch (err) {
      error = err;
    } finally {
      expect(error).toEqual(createError.NotFound());
    }
  });

  test("should ignore deleted accounts", async () => {
    let error = null;
    try {
      await getRecordAccessRole("1", "test+2@permanent.org");
    } catch (err) {
      error = err;
    } finally {
      expect(error).toEqual(createError.NotFound());
    }
  });

  test("should ignore deleted records", async () => {
    let error = null;
    try {
      await getRecordAccessRole("6", "test@permanent.org");
    } catch (err) {
      error = err;
    } finally {
      expect(error).toEqual(createError.NotFound());
    }
  });

  test("should ignore deleted shares", async () => {
    let error = null;
    try {
      await getRecordAccessRole("7", "test@permanent.org");
    } catch (err) {
      error = err;
    } finally {
      expect(error).toEqual(createError.NotFound());
    }
  });

  test("should ignore deleted folder_links", async () => {
    let error = null;
    try {
      await getRecordAccessRole("8", "test@permanent.org");
    } catch (err) {
      error = err;
    } finally {
      expect(error).toEqual(createError.NotFound());
    }
  });

  test("should throw internal server error if the database call fails", async () => {
    jest.spyOn(db, "sql").mockRejectedValue(new Error("Test error"));
    let error = null;
    try {
      await getRecordAccessRole("1", "test@permanent.org");
    } catch (err) {
      error = err;
    } finally {
      expect(error).toEqual(
        createError.InternalServerError("Failed to access database")
      );
    }
  });

  test("should throw not found error if the all access roles returned are null", async () => {
    jest.spyOn(db, "sql").mockImplementation(
      (async () =>
        ({
          rows: [
            { archiveAccessRole: null, shareAccessRole: null },
            { archiveAccessRole: null, shareAccessRole: null },
          ],
        } as object)) as unknown as typeof db.sql
    );
    let error = null;
    try {
      await getRecordAccessRole("1", "test@permanent.org");
    } catch (err) {
      error = err;
    } finally {
      expect(error).toEqual(createError.NotFound());
    }
  });
});

describe("getFolderAccessRole", () => {
  beforeEach(async () => {
    await clearDatabase();
    await loadFixtures();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  test("should get access role from account_archive", async () => {
    const accessLevel = await getFolderAccessRole("1", "test@permanent.org");
    expect(accessLevel).toEqual(AccessRole.Owner);
  });

  test("should throw a not found error if account has no access to folder", async () => {
    let error = null;
    try {
      await getFolderAccessRole("2", "test@permanent.org");
    } catch (err) {
      error = err;
    } finally {
      expect(error).toEqual(createError.NotFound());
    }
  });

  test("should get access role from access entry (i.e., a share)", async () => {
    const accessLevel = await getFolderAccessRole("3", "test@permanent.org");
    expect(accessLevel).toEqual(AccessRole.Viewer);
  });

  test("should use the more permissive access role, if access exists from both a share and an archive membership", async () => {
    const accessLevel = await getFolderAccessRole("4", "test@permanent.org");
    expect(accessLevel).toEqual(AccessRole.Manager);
  });

  test("should ignore deleted account_archives", async () => {
    let error = null;
    try {
      await getFolderAccessRole("5", "test@permanent.org");
    } catch (err) {
      error = err;
    } finally {
      expect(error).toEqual(createError.NotFound());
    }
  });

  test("should ignore deleted accounts", async () => {
    let error = null;
    try {
      await getFolderAccessRole("1", "test+2@permanent.org");
    } catch (err) {
      error = err;
    } finally {
      expect(error).toEqual(createError.NotFound());
    }
  });

  test("should ignore deleted folders", async () => {
    let error = null;
    try {
      await getFolderAccessRole("6", "test@permanent.org");
    } catch (err) {
      error = err;
    } finally {
      expect(error).toEqual(createError.NotFound());
    }
  });

  test("should ignore deleted shares", async () => {
    let error = null;
    try {
      await getFolderAccessRole("7", "test@permanent.org");
    } catch (err) {
      error = err;
    } finally {
      expect(error).toEqual(createError.NotFound());
    }
  });

  test("should ignore deleted folder_links", async () => {
    let error = null;
    try {
      await getFolderAccessRole("8", "test@permanent.org");
    } catch (err) {
      error = err;
    } finally {
      expect(error).toEqual(createError.NotFound());
    }
  });
});

describe("isItemPublic", () => {
  beforeEach(async () => {
    await clearDatabase();
    await loadFixtures();
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await clearDatabase();
  });
  test("should return true for a public record", async () => {
    const isPublic = await isItemPublic("9", "record");
    expect(isPublic).toEqual(true);
  });
  test("should return false for a private record", async () => {
    const isPublic = await isItemPublic("1", "record");
    expect(isPublic).toEqual(false);
  });
  test("should return true for a public folder", async () => {
    const isPublic = await isItemPublic("9", "folder");
    expect(isPublic).toEqual(true);
  });
  test("should return false for a private folder", async () => {
    const isPublic = await isItemPublic("1", "folder");
    expect(isPublic).toEqual(false);
  });
  test("should throw a 500 error if database call fails", async () => {
    jest.spyOn(db, "sql").mockRejectedValue(new Error("Test error"));
    let error = null;
    try {
      await isItemPublic("1", "folder");
    } catch (err) {
      error = err;
    } finally {
      expect(error).toEqual(
        createError.InternalServerError("Failed to access database")
      );
    }
  });
});
