import { NotFound, BadRequest, InternalServerError } from "http-errors";
import { db } from "../../database";
import { sendArchiveStewardNotification } from "../../email";
import { logger } from "../../log";
import { directiveService } from "./index";
import type { Directive, DirectiveTrigger } from "../model";

jest.mock("../../database");
jest.mock("../../email", () => ({
  sendArchiveStewardNotification: jest.fn(),
}));
jest.mock("../../log", () => ({
  logger: {
    error: jest.fn(),
  },
}));

const testDirectiveId = "39b2a5fa-3508-4030-91b6-21dc6ec7a1ab";
const testNote = "test note";

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

describe("updateDirective", () => {
  beforeEach(async () => {
    await clearDatabase();
    await loadFixtures();
  });
  afterEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();
  });

  test("should successfully update steward account and note", async () => {
    (
      sendArchiveStewardNotification as jest.MockedFunction<
        typeof sendArchiveStewardNotification
      >
    ).mockResolvedValueOnce(undefined);
    await directiveService.updateDirective(testDirectiveId, {
      emailFromAuthToken: "test@permanent.org",
      stewardEmail: "test+2@permanent.org",
      note: testNote,
    });

    const directiveResult = await db.query<Directive>(
      `SELECT 
        directive_id "directiveId",
        archive_id "archiveId",
        type,
        created_dt "createdDt",
        updated_dt "updatedDt",
        (
          SELECT
          jsonb_build_object(
            'email',
            primaryEmail,
            'name',
            fullName
          )
          FROM
            account
          WHERE
            accountId = steward_account_id
        ) "steward",
        note,
        execution_dt "executionDt"
      FROM
        directive
      WHERE
        archive_id = :archiveId`,
      { archiveId: 1 }
    );
    expect(directiveResult.rows.length).toBe(1);
    expect(directiveResult.rows[0]?.steward?.email).toBe(
      "test+2@permanent.org"
    );
    expect(directiveResult.rows[0]?.note).toBe(testNote);
    expect(directiveResult.rows[0]?.type).toBe("transfer");

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
    expect(triggerResult.rows[0]?.type).toBe("admin");
    expect(sendArchiveStewardNotification).toHaveBeenCalledWith(
      testDirectiveId
    );
  });

  test("should successfully update and note only", async () => {
    await directiveService.updateDirective(testDirectiveId, {
      emailFromAuthToken: "test@permanent.org",
      note: testNote,
    });

    const directiveResult = await db.query<Directive>(
      `SELECT 
        directive_id "directiveId",
        archive_id "archiveId",
        type,
        created_dt "createdDt",
        updated_dt "updatedDt",
        (
          SELECT
          jsonb_build_object(
            'email',
            primaryEmail,
            'name',
            fullName
          )
          FROM
            account
          WHERE
            accountId = steward_account_id
        ) "steward",
        note,
        execution_dt "executionDt"
      FROM
        directive
      WHERE
        archive_id = :archiveId`,
      { archiveId: 1 }
    );
    expect(directiveResult.rows.length).toBe(1);
    expect(directiveResult.rows[0]?.steward?.email).toBe(
      "test+1@permanent.org"
    );
    expect(directiveResult.rows[0]?.note).toBe(testNote);
    expect(directiveResult.rows[0]?.type).toBe("transfer");

    expect(sendArchiveStewardNotification).toHaveBeenCalledTimes(0);
  });

  test("should log error if notification email fails", async () => {
    const testError = new Error("out of cheese error - redo from start");
    (
      sendArchiveStewardNotification as jest.MockedFunction<
        typeof sendArchiveStewardNotification
      >
    ).mockRejectedValueOnce(testError);
    await directiveService.updateDirective(testDirectiveId, {
      emailFromAuthToken: "test@permanent.org",
      stewardEmail: "test+2@permanent.org",
      note: testNote,
    });

    expect(sendArchiveStewardNotification).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(testError);
  });

  test("should error if authenticated account doesn't own the directive", async () => {
    let error = null;
    try {
      await directiveService.updateDirective(testDirectiveId, {
        emailFromAuthToken: "test+2@permanent.org",
        stewardEmail: "test+2@permanent.org",
        note: testNote,
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error instanceof NotFound).toBe(true);
    }
  });

  test("should error if directive type is invalid", async () => {
    let error = null;
    try {
      await directiveService.updateDirective(testDirectiveId, {
        emailFromAuthToken: "test@permanent.org",
        stewardEmail: "test+2@permanent.org",
        note: testNote,
        type: "not_a_type",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error instanceof BadRequest).toBe(true);
    }
  });

  test("should error if steward email doesn't have an account", async () => {
    let error = null;
    try {
      await directiveService.updateDirective(testDirectiveId, {
        emailFromAuthToken: "test@permanent.org",
        stewardEmail: "not_an_account@permanent.org",
        note: testNote,
        type: "transfer",
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
      await directiveService.updateDirective(testDirectiveId, {
        emailFromAuthToken: "test@permanent.org",
        stewardEmail: "test+2@permanent.org",
        note: testNote,
        trigger: {
          type: "not_a_type",
        },
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error instanceof BadRequest).toBe(true);
    }
  });

  test("should error if directive is already executed", async () => {
    let error = null;
    await db.sql("directive.queries.mark_directives_executed", {
      directiveIds: [testDirectiveId],
    });
    try {
      await directiveService.updateDirective(testDirectiveId, {
        emailFromAuthToken: "test@permanent.org",
        stewardEmail: "test+2@permanent.org",
        note: testNote,
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error instanceof BadRequest).toBe(true);
    }
  });

  test("should error if trigger update fails unexpectedly", async () => {
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
              rows: [
                {
                  directiveId: testDirectiveId,
                },
              ],
            } as object)) as unknown as typeof db.sql
        )
        .mockImplementationOnce(
          (async () => ({ rows: [] } as object)) as unknown as typeof db.sql
        );

      await directiveService.updateDirective(testDirectiveId, {
        emailFromAuthToken: "test@permanent.org",
        stewardEmail: "test+2@permanent.org",
        note: testNote,
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
