import type {
  MessagesSendSuccessResponse,
  MessagesSendRejectResponse,
} from "@mailchimp/mailchimp_transactional";
import type { AxiosError } from "axios";
import {
  sendLegacyContactNotification,
  sendArchiveStewardNotification,
  sendEmail,
} from "./service";
import { MailchimpTransactional } from "../mailchimp";
import { db } from "../database";

jest.mock("../database");
jest.mock("../mailchimp", () => ({
  MailchimpTransactional: {
    messages: {
      sendTemplate: jest.fn(),
    },
  },
}));

const testLegacyContactId = "0cb0738c-5607-42d0-8014-8666a8d6ba13";
const testDirectiveId = "39b2a5fa-3508-4030-91b6-21dc6ec7a1ab";

const loadFixtures = async (): Promise<void> => {
  await db.sql("fixtures.create_test_accounts");
  await db.sql("fixtures.create_test_legacy_contacts");
  await db.sql("fixtures.create_test_archive");
  await db.sql("fixtures.create_test_account_archive");
  await db.sql("fixtures.create_test_directive");
  await db.sql("fixtures.create_test_profile_items");
};

const clearDatabase = async (): Promise<void> => {
  await db.query(
    "TRUNCATE account, legacy_contact, archive, directive, account_archive, profile_item CASCADE"
  );
};

describe("sendLegacyContactNotification", () => {
  beforeEach(async () => {
    await clearDatabase();
    await loadFixtures();
  });

  afterEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();
  });

  test("should send legacy contact notification successfully", async () => {
    const mockResponse = [
      {
        status: "sent",
        _id: "test",
        email: "contact@permanent.org",
        reject_reason: null,
      } as MessagesSendSuccessResponse,
    ];
    (
      MailchimpTransactional.messages.sendTemplate as jest.MockedFunction<
        typeof MailchimpTransactional.messages.sendTemplate
      >
    ).mockResolvedValueOnce(mockResponse);

    await sendLegacyContactNotification(testLegacyContactId);

    expect(MailchimpTransactional.messages.sendTemplate).toHaveBeenCalledWith({
      template_name: "legacy-contact-added",
      template_content: [],
      message: {
        from_email: "support@permanent.org",
        headers: { "Reply-To": "support@permanent.org" },
        track_opens: true,
        track_clicks: true,
        merge: true,
        merge_language: "mailchimp",
        from_name: "Jack Rando",
        to: [{ email: "contact@permanent.org", name: "John Rando" }],
        subject: "*|FROM_FULLNAME|* wants you to be their Legacy Contact",
        global_merge_vars: [
          { name: "from_fullname", content: "Jack Rando" },
          { name: "to_fullname", content: "John Rando" },
        ],
      },
    });
  });

  test("should throw an error if legacy contact details are not found in the database", async () => {
    await db.query(
      "DELETE FROM legacy_contact WHERE legacy_contact_id = :legacyContactId",
      { legacyContactId: testLegacyContactId }
    );

    await expect(
      sendLegacyContactNotification(testLegacyContactId)
    ).rejects.toThrow(`Legacy contact ${testLegacyContactId} not found`);

    expect(MailchimpTransactional.messages.sendTemplate).not.toHaveBeenCalled();
  });
});

describe("sendArchiveNotification", () => {
  beforeEach(async () => {
    await clearDatabase();
    await loadFixtures();
  });

  afterEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();
  });

  test("should send archive steward notification successfully", async () => {
    const mockResponse = [
      {
        status: "sent",
        _id: "test",
        email: "test+1@permanent.org",
        reject_reason: null,
      } as MessagesSendSuccessResponse,
    ];
    (
      MailchimpTransactional.messages.sendTemplate as jest.MockedFunction<
        typeof MailchimpTransactional.messages.sendTemplate
      >
    ).mockResolvedValueOnce(mockResponse);

    await sendArchiveStewardNotification(testDirectiveId);

    expect(MailchimpTransactional.messages.sendTemplate).toHaveBeenCalledWith({
      template_name: "archive-steward-added",
      template_content: [],
      message: {
        from_email: "support@permanent.org",
        headers: { "Reply-To": "support@permanent.org" },
        track_opens: true,
        track_clicks: true,
        merge: true,
        merge_language: "mailchimp",
        from_name: "Jack Rando",
        to: [{ email: "test+1@permanent.org", name: "John Rando" }],
        subject: "*|FROM_FULLNAME|* wants you to be their Archive Steward",
        global_merge_vars: [
          { name: "from_fullname", content: "Jack Rando" },
          { name: "to_fullname", content: "John Rando" },
          { name: "from_archive_name", content: "Jack Rando" },
        ],
      },
    });
  });

  test("should throw an error if archive stewardship details are not found in the database", async () => {
    await db.query(
      "DELETE FROM directive WHERE directive_id = :testDirectiveId",
      { testDirectiveId }
    );

    await expect(
      sendArchiveStewardNotification(testDirectiveId)
    ).rejects.toThrow(`Directive ${testDirectiveId} not found`);

    expect(MailchimpTransactional.messages.sendTemplate).not.toHaveBeenCalled();
  });
});

describe("sendEmail", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should successfully call Mailchimp", async () => {
    const mockResponse = [
      {
        status: "sent",
        _id: "test",
        email: "contact@permanent.org",
        reject_reason: null,
      } as MessagesSendSuccessResponse,
    ];
    (
      MailchimpTransactional.messages.sendTemplate as jest.MockedFunction<
        typeof MailchimpTransactional.messages.sendTemplate
      >
    ).mockResolvedValueOnce(mockResponse);

    await sendEmail(
      "legacy-contact-added",
      "Jack Rando",
      [{ email: "contact@permanent.org", name: "John Rando" }],
      "*|FROM_FULLNAME|* wants you to be their Legacy Contact",
      [
        { name: "from_fullname", content: "Jack Rando" },
        { name: "to_fullname", content: "John Rando" },
      ]
    );

    expect(MailchimpTransactional.messages.sendTemplate).toHaveBeenCalledWith({
      template_name: "legacy-contact-added",
      template_content: [],
      message: {
        from_email: "support@permanent.org",
        headers: { "Reply-To": "support@permanent.org" },
        track_opens: true,
        track_clicks: true,
        merge: true,
        merge_language: "mailchimp",
        from_name: "Jack Rando",
        to: [{ email: "contact@permanent.org", name: "John Rando" }],
        subject: "*|FROM_FULLNAME|* wants you to be their Legacy Contact",
        global_merge_vars: [
          { name: "from_fullname", content: "Jack Rando" },
          { name: "to_fullname", content: "John Rando" },
        ],
      },
    });
  });

  test("should throw an error if no email is sent", async () => {
    const mockResponse: MessagesSendSuccessResponse[] = [];
    (
      MailchimpTransactional.messages.sendTemplate as jest.MockedFunction<
        typeof MailchimpTransactional.messages.sendTemplate
      >
    ).mockResolvedValueOnce(mockResponse);

    await expect(
      sendEmail(
        "legacy-contact-added",
        "Jack Rando",
        [{ email: "contact@permanent.org", name: "John Rando" }],
        "*|FROM_FULLNAME|* wants you to be their Legacy Contact",
        [
          { name: "from_fullname", content: "Jack Rando" },
          { name: "to_fullname", content: "John Rando" },
        ]
      )
    ).rejects.toThrow("no email sent");
  });

  test("should throw an error if the Mailchimp API response indicates email not sent", async () => {
    const mockResponse = [
      {
        status: "rejected",
        reject_reason: "invalid",
        email: "contact@permanent.org",
        _id: "test",
      } as MessagesSendRejectResponse,
    ];
    (
      MailchimpTransactional.messages.sendTemplate as jest.MockedFunction<
        typeof MailchimpTransactional.messages.sendTemplate
      >
    ).mockResolvedValueOnce(mockResponse);

    await expect(
      sendEmail(
        "legacy-contact-added",
        "Jack Rando",
        [{ email: "contact@permanent.org", name: "John Rando" }],
        "*|FROM_FULLNAME|* wants you to be their Legacy Contact",
        [
          { name: "from_fullname", content: "Jack Rando" },
          { name: "to_fullname", content: "John Rando" },
        ]
      )
    ).rejects.toThrow("Email not sent. Status: rejected; Reason: invalid");
  });

  test("should throw an error if the Mailchimp API response is an axios error", async () => {
    const mockResponse = {
      config: {},
      isAxiosError: true,
      toJSON: () => {},
      response: {
        status: 500,
      },
    } as AxiosError;
    (
      MailchimpTransactional.messages.sendTemplate as jest.MockedFunction<
        typeof MailchimpTransactional.messages.sendTemplate
      >
    ).mockResolvedValueOnce(mockResponse);

    await expect(
      sendEmail(
        "legacy-contact-added",
        "Jack Rando",
        [{ email: "contact@permanent.org", name: "John Rando" }],
        "*|FROM_FULLNAME|* wants you to be their Legacy Contact",
        [
          { name: "from_fullname", content: "Jack Rando" },
          { name: "to_fullname", content: "John Rando" },
        ]
      )
    ).rejects.toThrow("Error calling Mailchimp. Status: 500");
  });
});
