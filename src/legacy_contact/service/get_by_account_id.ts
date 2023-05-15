import createError from "http-errors";
import type { LegacyContact } from "../model";
import { db } from "../../database";
import { logger } from "../../log";

export const getLegacyContactsByAccountId = async (
  accountEmail: string
): Promise<LegacyContact[]> => {
  try {
    const legacyContacts = await db.sql<LegacyContact>(
      "legacy_contact.queries.get_legacy_contacts_by_account_id",
      {
        primaryEmail: accountEmail,
      }
    );
    return legacyContacts.rows;
  } catch (err) {
    logger.error(err);
    throw new createError.InternalServerError(
      "Failed to retrieve legacy contacts"
    );
  }
};
