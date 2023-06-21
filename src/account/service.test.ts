import { NotFound, InternalServerError } from "http-errors";
import { Md5 } from "ts-md5";
import { MailchimpMarketing } from "../mailchimp";
import { db } from "../database";
import { logger } from "../log";
import { accountService } from "./service";
import type { UpdateTagsRequest } from "./models";

jest.mock("../database");
jest.mock("../mailchimp", () => ({
  MailchimpMarketing: {
    lists: {
      updateListMemberTags: jest.fn(),
    },
  },
}));
jest.mock("../log", () => ({
  logger: {
    error: jest.fn(),
  },
}));

const loadFixtures = async (): Promise<void> => {
  await db.sql("fixtures.create_test_accounts");
  await db.sql("fixtures.create_test_invites");
};

const clearDatabase = async (): Promise<void> => {
  await db.query("TRUNCATE account, invite CASCADE");
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
