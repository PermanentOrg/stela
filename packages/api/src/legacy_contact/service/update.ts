import createError from "http-errors";
import { logger } from "@stela/logger";
import type { UpdateLegacyContactRequest, LegacyContact } from "../model";
import { db } from "../../database";
import { sendLegacyContactNotification } from "../../email";

export const updateLegacyContact = async (
	legacyContactId: string,
	requestBody: UpdateLegacyContactRequest,
): Promise<LegacyContact> => {
	const legacyContactResult = await db
		.sql<LegacyContact & { emailChanged: boolean }>(
			"legacy_contact.queries.update_legacy_contact",
			{
				legacyContactId,
				primaryEmail: requestBody.emailFromAuthToken,
				name: requestBody.name,
				email: requestBody.email,
			},
		)
		.catch((err) => {
			logger.error(err);
			throw new createError.InternalServerError(
				"Failed to update legacy contact",
			);
		});

	if (legacyContactResult.rows[0] === undefined) {
		throw new createError.NotFound("Legacy contact not found");
	}

	const { emailChanged, ...legacyContact } = legacyContactResult.rows[0];

	if (emailChanged) {
		await sendLegacyContactNotification(legacyContactId).catch((err) => {
			logger.error(err);
		});
	}

	return legacyContact;
};
