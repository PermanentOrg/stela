import { NotFound, InternalServerError, BadRequest } from "http-errors";
import { Md5 } from "ts-md5";
import { logger } from "@stela/logger";
import { MailchimpMarketing } from "../mailchimp";
import { db } from "../database";
import { accountService } from "./service";
import type { UpdateTagsRequest } from "./models";
import { EVENT_ACTION, EVENT_ACTOR, EVENT_ENTITY } from "../constants";

jest.mock("../database");
jest.mock("../mailchimp", () => ({
  MailchimpMarketing: {
    lists: {
      updateListMemberTags: jest.fn(),
    },
  },
}));
jest.mock("@stela/logger", () => ({
  logger: {
    error: jest.fn(),
  },
}));

const loadFixtures = async (): Promise<void> => {
  await db.sql("fixtures.create_test_accounts");
  await db.sql("fixtures.create_test_invites");

  // TODO (Valle) -> turn into fixtures
  await db.query(`insert into archive (archiveid)
      values (22), (34)`);

  await db.query(`insert into account_archive
        (account_archiveid, accountid, archiveid, accessrole, "position", "type", status)
      values
        (1, 2,	22,	'access.role.owner',	0,	'type.account.standard',	'status.generic.ok'),
        (2, 5,	34,	'access.role.owner',	0,	'type.account.standard',	'status.generic.ok'),
        (3, 5,	22,	'access.role.viewer',	0,	'type.account.standard',	'status.generic.ok')`);
};

const clearDatabase = async (): Promise<void> => {
  await db.query(
    "TRUNCATE event, account_archive, account, archive, invite CASCADE"
  );
};

describe("updateTags", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should call updateListMemberTags with the correct arguments", async () => {
    const requestBody: UpdateTagsRequest = {
      emailFromAuthToken: "test@permanent.org",
      addTags: ["tag1", "tag2"],
      removeTags: ["tag3", "tag4"],
    };

    const expectedTags = [
      { name: "tag1", status: "active" },
      { name: "tag2", status: "active" },
      { name: "tag3", status: "inactive" },
      { name: "tag4", status: "inactive" },
    ];

    const expectedListId = process.env["MAILCHIMP_COMMUNITY_LIST_ID"] ?? "";
    const expectedSubscriberHash = Md5.hashStr(requestBody.emailFromAuthToken);

    (
      MailchimpMarketing.lists.updateListMemberTags as jest.MockedFunction<
        typeof MailchimpMarketing.lists.updateListMemberTags
      >
    ).mockResolvedValue(null);

    await accountService.updateTags(requestBody);

    expect(MailchimpMarketing.lists.updateListMemberTags).toHaveBeenCalledWith(
      expectedListId,
      expectedSubscriberHash,
      { tags: expectedTags }
    );
  });

  test("should throw an error if MailChimp call fails", async () => {
    (
      MailchimpMarketing.lists.updateListMemberTags as jest.MockedFunction<
        typeof MailchimpMarketing.lists.updateListMemberTags
      >
    ).mockResolvedValue({
      detail: "Out of Cheese - Redo from Start",
      status: 500,
      type: "",
      title: "",
      instance: "",
    });
    let error = null;
    try {
      await accountService.updateTags({
        emailFromAuthToken: "test@permanent.org",
        addTags: ["tag1", "tag2"],
        removeTags: ["tag3", "tag4"],
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
});

describe("getSignupDetails", () => {
  beforeEach(async () => {
    await clearDatabase();
    await loadFixtures();
  });
  afterEach(async () => {
    jest.clearAllMocks();
    await clearDatabase();
  });

  test("should return an account's signup details", async () => {
    const signupDetails = await accountService.getSignupDetails(
      "test@permanent.org"
    );
    expect(signupDetails.token).toEqual("earlyb1rd");
  });

  test("should throw an error if the account does not exist", async () => {
    let error = null;
    try {
      await accountService.getSignupDetails("not_an_account@permanent.org");
    } catch (err) {
      error = err;
    } finally {
      expect(error instanceof NotFound).toBe(true);
    }
  });

  test("should throw an error if the account has no signup details", async () => {
    let error = null;
    try {
      await accountService.getSignupDetails("test+1@permanent.org");
    } catch (err) {
      error = err;
    } finally {
      expect(error instanceof NotFound).toBe(true);
    }
  });

  test("should throw an error if database call fails unexpectedly", async () => {
    let error = null;
    try {
      jest.spyOn(db, "sql").mockImplementationOnce((async () => {
        throw new Error("out of cheese - redo from start");
      }) as unknown as typeof db.sql);
      await accountService.getSignupDetails("test@permanent.org");
    } catch (err) {
      error = err;
    } finally {
      expect(error instanceof InternalServerError).toBe(true);
      expect(logger.error).toHaveBeenCalled();
    }
  });
});

describe("leaveArchive", () => {
  const ip = "127.0.0.1";
  const selectEventRow = `
      SELECT * FROM event e
      WHERE e.entity = '${EVENT_ENTITY.Account}'
        AND e.version = 1
        AND e.entity_id = '5'
        AND e.action = '${EVENT_ACTION.Update}'
        AND e.ip = '127.0.0.1'
        AND e.actor_type = '${EVENT_ACTOR.User}'
        AND e.actor_id = 'b5461dc2-1eb0-450e-b710-fef7b2cafe1e'`;

  beforeEach(async () => {
    await loadFixtures();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  test("should successfully leave an archive", async () => {
    const selectAccountArchiveRow = `SELECT * FROM account_archive WHERE
    accountid = 5 AND archiveid = 22`;

    const accounArchiveBeforeLeaveResult = await db.query(
      selectAccountArchiveRow
    );
    expect(accounArchiveBeforeLeaveResult.rows.length).toBe(1);

    await accountService.leaveArchive({
      emailFromAuthToken: "test+3@permanent.org",
      userSubjectFromAuthToken: "b5461dc2-1eb0-450e-b710-fef7b2cafe1e",
      ip,
      archiveId: "22",
    });

    const accounArchiveAfterLeaveResult = await db.query(
      selectAccountArchiveRow
    );
    expect(accounArchiveAfterLeaveResult.rows.length).toBe(0);
  });

  test("should throw 404 error if account archive relationship is not found", async () => {
    let error = null;

    try {
      await accountService.leaveArchive({
        emailFromAuthToken: "test+3@permanent.org",
        userSubjectFromAuthToken: "b5461dc2-1eb0-450e-b710-fef7b2cafe1e",
        ip,
        archiveId: "2022",
      });
    } catch (e) {
      error = e;
    } finally {
      expect(error instanceof NotFound).toBe(true);
    }
  });

  test("should throw 400 error if the account owns the archive", async () => {
    let error = null;

    try {
      await accountService.leaveArchive({
        emailFromAuthToken: "test+3@permanent.org",
        userSubjectFromAuthToken: "b5461dc2-1eb0-450e-b710-fef7b2cafe1e",
        ip,
        archiveId: "34",
      });
    } catch (e) {
      error = e;
    } finally {
      expect(error instanceof BadRequest).toBe(true);
    }
  });

  test("should log an action in the database events table", async () => {
    const eventsBeforeLeave = await db.query(selectEventRow);
    expect(eventsBeforeLeave.rows.length).toBe(0);

    await accountService.leaveArchive({
      emailFromAuthToken: "test+3@permanent.org",
      userSubjectFromAuthToken: "b5461dc2-1eb0-450e-b710-fef7b2cafe1e",
      ip,
      archiveId: "22",
    });

    const eventsAfterLeave = await db.query(selectEventRow);
    expect(eventsAfterLeave.rows.length).toBe(1);
  });

  test("logged event contains expected body values", async () => {
    await accountService.leaveArchive({
      emailFromAuthToken: "test+3@permanent.org",
      userSubjectFromAuthToken: "b5461dc2-1eb0-450e-b710-fef7b2cafe1e",
      ip,
      archiveId: "22",
    });

    const eventResult = await db.query(selectEventRow);
    expect(eventResult.rows.length).toBe(1);

    const eventBody = eventResult.rows[0].body;
    expect(eventBody).toEqual({ archiveId: "22", accountArchiveId: "3" });
  });
});
