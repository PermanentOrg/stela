import createError from "http-errors";
import { logger } from "@stela/logger";
import { db } from "../../database";
import type { Archive } from "../models";

export const updateArchive = async (
	archiveId: string,
	milestoneSortOrder: string,
	email: string,
): Promise<Archive> => {
	const updateArchiveResult = await db
		.sql<Archive>("archive.queries.update_archive", {
			archiveId,
			milestoneSortOrder,
			email,
		})
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError("failed to update archive");
		});
	if (updateArchiveResult.rows[0] === undefined) {
		throw new createError.NotFound(
			"archive not found or you do not have permission to update it",
		);
	}
	return updateArchiveResult.rows[0];
};
