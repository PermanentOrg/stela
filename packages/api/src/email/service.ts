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

export const sendEmail = async (
	templateName: string,
	fromName: string,
	toData: { email: string; name?: string }[],
	subject: string,
	mergeVariables: { name: string; content: string }[],
): Promise<void> => {
	const response = await MailchimpTransactional.messages.sendTemplate({
		template_name: templateName,
		template_content: [],
		message: {
			...defaultMessage,
			from_name: fromName,
			to: toData,
			subject,
			global_merge_vars: mergeVariables,
		},
	});

	if ("isAxiosError" in response) {
		throw new Error(
			`Error calling Mailchimp. Status: ${response.response?.status ?? ""}`,
		);
	} else if (response[0] === undefined) {
		throw new Error("no email sent");
	} else if (response[0].status !== "sent") {
		throw new Error(
			`Email not sent. Status: ${response[0].status}; Reason: ${
				response[0].reject_reason ?? ""
			}`,
		);
	}
};

export const sendLegacyContactNotification = async (
	legacyContactId: string,
): Promise<void> => {
	const legacyContactDetailsResult = await db.sql<{
		accountName: string;
		legacyContactName: string;
		legacyContactEmail: string;
	}>("email.queries.get_legacy_contact_details", { legacyContactId });
	if (legacyContactDetailsResult.rows[0] === undefined) {
		throw new Error(`Legacy contact ${legacyContactId} not found`);
	}
	const {
		rows: [{ accountName, legacyContactName, legacyContactEmail }],
	} = legacyContactDetailsResult;

	await sendEmail(
		"legacy-contact-added",
		accountName,
		[{ email: legacyContactEmail, name: legacyContactName }],
		"*|FROM_FULLNAME|* wants you to be their Legacy Contact",
		[
			{ name: "from_fullname", content: accountName },
			{ name: "to_fullname", content: legacyContactName },
		],
	);
};

export const sendArchiveStewardNotification = async (
	directiveId: string,
): Promise<void> => {
	const archiveStewardshipDetailsResult = await db.sql<{
		stewardName: string;
		stewardEmail: string;
		ownerName: string;
		archiveName: string;
	}>("email.queries.get_archive_stewardship_details", { directiveId });
	if (archiveStewardshipDetailsResult.rows[0] === undefined) {
		throw new Error(`Directive ${directiveId} not found`);
	}
	const {
		rows: [{ stewardName, stewardEmail, ownerName, archiveName }],
	} = archiveStewardshipDetailsResult;
	await sendEmail(
		"archive-steward-added",
		ownerName,
		[{ email: stewardEmail, name: stewardName }],
		"*|FROM_FULLNAME|* wants you to be their Archive Steward",
		[
			{ name: "from_fullname", content: ownerName },
			{ name: "to_fullname", content: stewardName },
			{ name: "from_archive_name", content: archiveName },
		],
	);
};

export const sendInvitationNotification = async (
	fromEmail: string,
	toEmail: string,
	message: string,
	giftAmount: number,
	token: string,
): Promise<void> => {
	const fullNameResult = await db.sql<{ fullName: string }>(
		"email.queries.get_full_name_by_account_email",
		{ emails: [fromEmail] },
	);
	if (fullNameResult.rows[0] === undefined) {
		throw new Error(`Account with primary email ${fromEmail} not found`);
	}
	const {
		rows: [{ fullName }],
	} = fullNameResult;
	await sendEmail(
		"invitation-from-relationship",
		fullName,
		[{ email: toEmail }],
		"",
		[
			{ name: "from_fullname", content: fullName },
			{ name: "space_amount_hr", content: `${giftAmount}GB` },
			{ name: "token", content: token },
			{ name: "message", content: message },
			{
				name: "click_url",
				content: `https://${
					process.env["ENV"] === "production"
						? ""
						: `${process.env["ENV"] ?? ""}.`
				}permanent.org/app/signup?primaryEmail=${btoa(
					toEmail,
				)}&inviteCode=${btoa(token)}`,
			},
		],
	);
};

export const sendGiftNotification = async (
	fromEmail: string,
	toEmail: string,
	note: string,
	giftAmount: number,
): Promise<void> => {
	const fullNameResult = await db.sql<{ fullName: string; email: string }>(
		"email.queries.get_full_name_by_account_email",
		{ emails: [fromEmail, toEmail] },
	);

	const fromResult = fullNameResult.rows.find((row) => row.email === fromEmail);
	if (fromResult === undefined) {
		throw new Error(`Account with primary email ${fromEmail} not found`);
	}
	const { fullName: fromFullName } = fromResult;

	const toResult = fullNameResult.rows.find((row) => row.email === toEmail);
	if (toResult === undefined) {
		throw new Error(`Account with primary email ${toEmail} not found`);
	}
	const { fullName: toFullName } = toResult;

	await sendEmail(
		"gift-notification",
		fromFullName,
		[{ email: toEmail }],
		"*|FROM_FULLNAME|* is giving you *|SPACE_AMOUNT|* GB of Permanent storage",
		[
			{ name: "from_fullname", content: fromFullName },
			{ name: "to_fullname", content: toFullName },
			{ name: "space_amount", content: giftAmount.toString() },
			{ name: "note", content: note },
		],
	);
};
