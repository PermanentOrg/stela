import createError from "http-errors";
import { logger } from "@stela/logger";
import { db } from "../database";
import type { Access } from "../access/models";

const getAccessByFolder = async (
  folderId: string,
  archiveId: string
): Promise<Access[]> => {
  const accessResult = await db
    .sql<Access>("folder.queries.get_access_by_folder", {
      folderId,
      archiveId,
    })
    .catch((err) => {
      logger.error(err);
      throw new createError.InternalServerError(
        "Failed to get access for archive"
      );
    });
  if (accessResult.rows.length === 0) {
    return [];
  }
  return accessResult.rows;
};

export const folderAccess = {
  getAccessByFolder,
};
