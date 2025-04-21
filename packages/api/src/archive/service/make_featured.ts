import createError from "http-errors";
import { logger } from "@stela/logger";
import { db } from "../../database";

export const makeFeatured = async (archiveId: string): Promise<void> => {
	const makeFeaturedArchiveResult = await db
		.sql("archive.queries.make_featured_archive", {
			archiveId,
		})
		.catch((err) => {
			logger.error(err);
			throw new createError.InternalServerError(
				"failed to make archive featured",
			);
		});
	if (makeFeaturedArchiveResult.rows[0] === undefined) {
		throw new createError.BadRequest(
			"archive doesn't exist, is not public, or is already featured",
		);
	}
};
