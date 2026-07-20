import createError from "http-errors";
import { logger } from "@stela/logger";
import { db } from "../../database.js";
import type { Tag } from "../models.js";

export const getPublicTags = async (archiveId: string): Promise<Tag[]> => {
	const tagsResult = await db
		.sql<Tag>("archive.queries.get_public_tags", { archiveId })
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError("failed to retrieve tags");
		});
	return tagsResult.rows;
};
