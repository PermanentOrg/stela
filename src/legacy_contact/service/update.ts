import createError from "http-errors";
import type { UpdateLegacyContactRequest, LegacyContact } from "../model";
import { db } from "../../database";
import { logger } from "../../log";

export const updateLegacyContact = async (
  legacyContactId: string,
  requestBody: UpdateLegacyContactRequest
): Promise<LegacyContact> => {
  try {
    const legacyContact = await db.sql<LegacyContact>(
      "legacy_contact.queries.update_legacy_contact",
      {
        legacyContactId,
        primaryEmail: requestBody.emailFromAuthToken,
        name: requestBody.name,
        email: requestBody.email,
      }
    );
    if (legacyContact.rows[0] === undefined) {
      throw new createError.NotFound("Legacy contact not found");
    }
    return legacyContact.rows[0];
  } catch (err) {
    if (err instanceof createError.NotFound) {
      throw err;
    } else {
      logger.error(err);
      throw new createError.InternalServerError(
        "Failed to update legacy contact"
      );
    }
  }
};
