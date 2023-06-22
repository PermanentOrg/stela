import createError from "http-errors";
import { db } from "../database";
import { logger } from "../log";
import type { Tag } from "./models";

const getPublicTags = async (archiveId: string): Promise<Tag[]> => {
  const tagsResult = await db
    .sql<Tag>("archive.queries.get_public_tags", { archiveId })
    .catch((err) => {
      logger.error(err);
      throw new createError.InternalServerError("failed to retrieve tags");
    });
  return tagsResult.rows;
};

export const archiveService = {
  getPublicTags,
};
