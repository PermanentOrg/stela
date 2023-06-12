import createError from "http-errors";
import type { UpdateLegacyContactRequest, LegacyContact } from "../model";
import { db } from "../../database";
import { logger } from "../../log";
import { sendLegacyContactNotification } from "../../email";

export const updateLegacyContact = async (
  legacyContactId: string,
  requestBody: UpdateLegacyContactRequest
): Promise<LegacyContact> => {
  const legacyContact = await db
    .sql<LegacyContact & { emailChanged: boolean }>(
      "legacy_contact.queries.update_legacy_contact",
      {
        legacyContactId,
        primaryEmail: requestBody.emailFromAuthToken,
        name: requestBody.name,
        email: requestBody.email,
      }
    )
    .catch((err) => {
      logger.error(err);
      throw new createError.InternalServerError(
        "Failed to update legacy contact"
      );
    });

  if (legacyContact.rows[0] === undefined) {
    throw new createError.NotFound("Legacy contact not found");
  }

  if (legacyContact.rows[0].emailChanged) {
    await sendLegacyContactNotification(legacyContactId).catch((err) => {
      logger.error(err);
    });
  }

  return {
    legacyContactId: legacyContact.rows[0].legacyContactId,
    accountId: legacyContact.rows[0].accountId,
    name: legacyContact.rows[0].name,
    email: legacyContact.rows[0].email,
    createdDt: legacyContact.rows[0].createdDt,
    updatedDt: legacyContact.rows[0].updatedDt,
  };
};
