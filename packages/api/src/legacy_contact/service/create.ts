import createError from "http-errors";
import { logger } from "@stela/logger";
import type { CreateLegacyContactRequest, LegacyContact } from "../model";
import { db } from "../../database";
import { sendLegacyContactNotification } from "../../email";

export const createLegacyContact = async (
  requestBody: CreateLegacyContactRequest
): Promise<LegacyContact> => {
  const legacyContactResult = await db
    .sql<LegacyContact>("legacy_contact.queries.create_legacy_contact", {
      accountEmail: requestBody.emailFromAuthToken,
      name: requestBody.name,
      email: requestBody.email,
    })
    .catch((err) => {
      logger.error(err);
      throw new createError.InternalServerError(
        "Failed to create legacy contact"
      );
    });

  if (legacyContactResult.rows[0] === undefined) {
    throw new createError.InternalServerError(
      "Failed to create legacy contact"
    );
  }

  await sendLegacyContactNotification(
    legacyContactResult.rows[0].legacyContactId
  ).catch((err: unknown) => {
    logger.error(err);
  });

  return legacyContactResult.rows[0];
};
