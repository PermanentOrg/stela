import { NotFound, BadRequest, InternalServerError } from "http-errors";
import { db } from "../../database";
import { directiveService } from "./index";
import type { Directive, DirectiveTrigger } from "../model";

jest.mock("../../database");

const loadFixtures = async (): Promise<void> => {
  await db.sql("fixtures.create_test_accounts");
  await db.sql("fixtures.create_test_archive");
  await db.sql("fixtures.create_test_account_archive");
};

const clearDatabase = async (): Promise<void> => {
  await db.query(
    "TRUNCATE account, archive, account_archive, directive, directive_trigger CASCADE"
  );
};

describe("createDirective", () => {
  beforeEach(async () => {
    await clearDatabase();
    await loadFixtures();
  });
  afterEach(async () => {
    await clearDatabase();
  });

  test("should successfully create a directive and trigger", async () => {
    await directiveService.createDirective({
      emailFromAuthToken: "test@permanent.org",
      archiveId: "1",
      stewardEmail: "test@permanent.org",
      type: "transfer",
      trigger: {
        type: "admin",
      },
    });

    const directiveResult = await db.query<Directive>(
      `SELECT 
        directive_id "directiveId",
        archive_id "archiveId",
        type,
        created_dt "createdDt",
        updated_dt "updatedDt",
        steward_account_id "stewardAccountId",
        note,
        execution_dt "executionDt"
      FROM
        directive
      WHERE
        archive_id = :archiveId`,
      { archiveId: 1 }
    );
    expect(directiveResult.rows.length).toBe(1);

    const triggerResult = await db.query<DirectiveTrigger>(
      `SELECT
        directive_trigger_id "directiveTriggerId",
        directive_id "directiveId",
        type,
        created_dt "createdDt",
        updated_dt "updatedDt"
      FROM
        directive_trigger
      WHERE
        directive_id = :directiveId`,
      { directiveId: directiveResult.rows[0]?.directiveId }
    );
    expect(triggerResult.rows.length).toBe(1);
  });

  test("should error if authenticated account doesn't own the archive", async () => {
    let error = null;
    try {
      await directiveService.createDirective({
        emailFromAuthToken: "test+1@permanent.org",
        archiveId: "1",
        stewardEmail: "test@permanent.org",
        type: "transfer",
        trigger: {
          type: "admin",
        },
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error instanceof NotFound).toBe(true);
    }
  });

  test("should error if type is invalid", async () => {
    let error = null;
    try {
      await directiveService.createDirective({
        emailFromAuthToken: "test@permanent.org",
        archiveId: "1",
        stewardEmail: "test@permanent.org",
        type: "not_a_type",
        trigger: {
          type: "admin",
        },
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error instanceof BadRequest).toBe(true);
    }
  });

  test("should error if trigger type is invalid", async () => {
    let error = null;
    try {
      await directiveService.createDirective({
        emailFromAuthToken: "test@permanent.org",
        archiveId: "1",
        stewardEmail: "test@permanent.org",
        type: "transfer",
        trigger: {
          type: "date",
        },
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error instanceof BadRequest).toBe(true);
    }
  });

  test("should error if steward account not found", async () => {
    let error = null;
    try {
      jest
        .spyOn(db, "sql")
        .mockImplementationOnce(
          (async () =>
            ({
              rows: [{ hasAccess: true }],
            } as object)) as unknown as typeof db.sql
        )
        .mockImplementationOnce(
          (async () => ({ rows: [] } as object)) as unknown as typeof db.sql
        );
      await directiveService.createDirective({
        emailFromAuthToken: "test@permanent.org",
        archiveId: "1",
        stewardEmail: "test@permanent.org",
        type: "transfer",
        trigger: {
          type: "admin",
        },
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error instanceof NotFound).toBe(true);
    }
  });

  test("should error if directive can't be created", async () => {
    let error = null;
    try {
      jest
        .spyOn(db, "sql")
        .mockImplementationOnce(
          (async () =>
            ({
              rows: [{ hasAccess: true }],
            } as object)) as unknown as typeof db.sql
        )
        .mockImplementationOnce(
          (async () =>
            ({
              rows: [{ stewardAccountId: 1 }],
            } as object)) as unknown as typeof db.sql
        )
        .mockImplementationOnce(
          (async () => ({ rows: [] } as object)) as unknown as typeof db.sql
        );
      await directiveService.createDirective({
        emailFromAuthToken: "test@permanent.org",
        archiveId: "1",
        stewardEmail: "test@permanent.org",
        type: "transfer",
        trigger: {
          type: "admin",
        },
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error instanceof InternalServerError).toBe(true);
    }
  });

  test("should error if trigger can't be created", async () => {
    let error = null;
    try {
      jest
        .spyOn(db, "sql")
        .mockImplementationOnce(
          (async () =>
            ({
              rows: [{ hasAccess: true }],
            } as object)) as unknown as typeof db.sql
        )
        .mockImplementationOnce(
          (async () =>
            ({
              rows: [{ stewardAccountId: 1 }],
            } as object)) as unknown as typeof db.sql
        )
        .mockImplementationOnce(
          (async () =>
            ({
              rows: [
                {
                  directiveId: 1,
                },
              ],
            } as object)) as unknown as typeof db.sql
        )
        .mockImplementationOnce(
          (async () => ({ rows: [] } as object)) as unknown as typeof db.sql
        );
      await directiveService.createDirective({
        emailFromAuthToken: "test@permanent.org",
        archiveId: "1",
        stewardEmail: "test@permanent.org",
        type: "transfer",
        trigger: {
          type: "admin",
        },
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error instanceof InternalServerError).toBe(true);
    }
  });
});
