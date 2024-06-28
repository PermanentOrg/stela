import type { Response } from "node-fetch";
import { db } from "../../database";
import { legacyClient } from "../../legacy_client";
import { directiveService } from "./index";
import type { Directive } from "../model";

jest.mock("../../database");
jest.mock("../../legacy_client");

const testDirectiveId = "39b2a5fa-3508-4030-91b6-21dc6ec7a1ab";

const loadFixtures = async (): Promise<void> => {
  await db.sql("fixtures.create_test_accounts");
  await db.sql("fixtures.create_test_archives");
  await db.sql("fixtures.create_test_account_archives");
  await db.sql("fixtures.create_test_directives");
  await db.sql("fixtures.create_test_directive_triggers");
};

const clearDatabase = async (): Promise<void> => {
  await db.query(
    "TRUNCATE account, archive, account_archive, directive, directive_trigger CASCADE"
  );
};

describe("triggerAccountAdminDirectives", () => {
  beforeEach(async () => {
    await clearDatabase();
    await loadFixtures();
  });
  afterEach(async () => {
    await clearDatabase();
  });

  test("should respond with success when transfer directive succesfully executed", async () => {
    jest
      .spyOn(legacyClient, "transferArchiveOwnership")
      .mockResolvedValue(Promise.resolve({ status: 200 } as Response));
    const response = await directiveService.triggerAccountAdminDirectives("2");
    expect(response.length).toBe(1);
    expect(response[0]?.outcome).toBe("success");

    const directiveResult = await db.query<Directive>(
      'SELECT execution_dt "executionDt" FROM directive WHERE directive_id = :testDirectiveId',
      { testDirectiveId }
    );
    expect(directiveResult.rows[0]?.executionDt).toBeTruthy();
  });

  test("should respond with error when transfer directive fails to execute", async () => {
    jest
      .spyOn(legacyClient, "transferArchiveOwnership")
      .mockResolvedValue(Promise.resolve({ status: 500 } as Response));
    const response = await directiveService.triggerAccountAdminDirectives("2");
    expect(response.length).toBe(1);
    expect(response[0]?.outcome).toBe("error");
  });

  test("should not try to execute an already executed directive", async () => {
    await db.sql("directive.queries.mark_directives_executed", {
      directiveIds: [testDirectiveId],
    });
    const response = await directiveService.triggerAccountAdminDirectives("2");
    expect(response.length).toBe(0);
  });

  test("should respond with error when transfer directive has unsupported type", async () => {
    jest.spyOn(db, "sql").mockResolvedValue({
      command: "",
      row_count: 1,
      rows: [{ type: "not_a_type" }],
    });
    const response = await directiveService.triggerAccountAdminDirectives("2");
    expect(response.length).toBe(1);
    expect(response[0]?.outcome).toBe("error");
  });
});
