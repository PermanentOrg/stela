import { MailchimpTransactional } from "../mailchimp";
import { db } from "../database";

const defaultFromEmail = "support@permanent.org";
const defaultMessage = {
  from_email: defaultFromEmail,
  headers: { "Reply-To": defaultFromEmail },
  track_opens: true,
  track_clicks: true,
  merge: true,
  merge_language: "mailchimp" as const,
};

export const sendLegacyContactNotification = async (
  legacyContactId: string
): Promise<void> => {
  const legacyContactDetailsResult = await db.sql<{
    accountName: string;
    legacyContactName: string;
    legacyContactEmail: string;
  }>("email.queries.get_legacy_contact_details", { legacyContactId });
  if (legacyContactDetailsResult.rows[0] === undefined) {
    throw new Error(`Legacy contact ${legacyContactId} not found`);
  }
  const { accountName, legacyContactName, legacyContactEmail } =
    legacyContactDetailsResult.rows[0];
  const response = await MailchimpTransactional.messages.sendTemplate({
    template_name: "legacy-contact-added",
    template_content: [],
    message: {
      ...defaultMessage,
      from_name: accountName,
      to: [{ email: legacyContactEmail, name: legacyContactName }],
      subject: "*|FROM_FULLNAME|* wants you to be their Legacy Contact",
      global_merge_vars: [
        { name: "from_fullname", content: accountName },
        { name: "to_fullname", content: legacyContactName },
      ],
    },
  });

  if ("isAxiosError" in response) {
    throw response;
  } else if (!response[0]) {
    throw new Error("no email sent");
  } else if (response[0].status !== "sent") {
    throw new Error(
      `Email not sent. Status: ${response[0].status}; Reason: ${
        response[0].reject_reason ?? ""
      }`
    );
  }
};
