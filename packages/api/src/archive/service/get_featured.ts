import createError from "http-errors";
import { logger } from "@stela/logger";
import { db } from "../../database";
import type { FeaturedArchive } from "../models";

export const getFeatured = async (): Promise<FeaturedArchive[]> => {
	const archives = await db
		.sql<FeaturedArchive>("archive.queries.get_featured_archives")
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError(
				"failed to retrieve featured archives",
			);
		});
	return archives.rows;
};
