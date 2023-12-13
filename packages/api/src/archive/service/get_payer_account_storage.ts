import createError from "http-errors";
import { logger } from "@stela/logger";
import { db } from "../../database";
import type { AccountStorage } from "../models";

export const getPayerAccountStorage = async (
  archiveId: string,
  accountEmail: string
): Promise<AccountStorage> => {
  const accountStoragesResult = await db
    .sql<AccountStorage>("archive.queries.get_payer_account_storage", {
      archiveId,
      accountEmail,
    })
    .catch((err) => {
      logger.error(err);
      throw new createError.InternalServerError(
        "failed to retrieve account storage"
      );
    });
  if (!accountStoragesResult.rows[0]) {
    throw new createError.NotFound("payer account storage not found");
  }
  return accountStoragesResult.rows[0];
};
