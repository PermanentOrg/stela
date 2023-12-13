import createError from "http-errors";
import { logger } from "@stela/logger";
import { db } from "../../database";

export const unfeature = async (archiveId: string): Promise<void> => {
  await db
    .sql("archive.queries.unfeature_archive", {
      archiveId,
    })
    .catch((err) => {
      logger.error(err);
      throw new createError.InternalServerError(
        "failed to remove archive from featured archive"
      );
    });
};
