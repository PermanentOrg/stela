import createError from "http-errors";
import { logger } from "@stela/logger";
import { db } from "../database";
import type { Access } from "./models";

const getAccess = async (folderLinkId: string): Promise<Access[]> => {
  const accessResult = await db
    .sql<Access>("access.queries.get_access_by_folder_link", {
      folderLinkId,
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
export const accessService = {
  getAccess,
};
