import type {
  MessagesSendSuccessResponse,
  MessagesSendRejectResponse,
} from "@mailchimp/mailchimp_transactional";
import { sendLegacyContactNotification } from "./service";
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

const loadFixtures = async (): Promise<void> => {
  await db.sql("fixtures.create_test_accounts");
  await db.sql("fixtures.create_test_legacy_contacts");
};

const clearDatabase = async (): Promise<void> => {
  await db.query("TRUNCATE account, legacy_contact CASCADE");
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

  test("should throw an error if no email is sent", async () => {
    const mockResponse: MessagesSendSuccessResponse[] = [];
    (
      MailchimpTransactional.messages.sendTemplate as jest.MockedFunction<
        typeof MailchimpTransactional.messages.sendTemplate
      >
    ).mockResolvedValueOnce(mockResponse);

    await expect(
      sendLegacyContactNotification(testLegacyContactId)
    ).rejects.toThrow("no email sent");

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
      sendLegacyContactNotification(testLegacyContactId)
    ).rejects.toThrow("Email not sent. Status: rejected; Reason: invalid");

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
});
