import createError from "http-errors";
import type { CreateLegacyContactRequest, LegacyContact } from "../model";
import { db } from "../../database";
import { logger } from "../../log";

export const createLegacyContact = async (
  requestBody: CreateLegacyContactRequest
): Promise<LegacyContact> => {
  try {
    const legacyContactResult = await db.sql<LegacyContact>(
      "legacy_contact.queries.create_legacy_contact",
      {
        accountEmail: requestBody.emailFromAuthToken,
        name: requestBody.name,
        email: requestBody.email,
      }
    );
    if (legacyContactResult.rows[0] === undefined) {
      throw new Error();
    }
    return legacyContactResult.rows[0];
  } catch (err) {
    logger.error(err);
    throw new createError.InternalServerError(
      "Failed to create legacy contact"
    );
  }
};
