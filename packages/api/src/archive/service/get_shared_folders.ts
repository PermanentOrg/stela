import { logger } from "@stela/logger";
import createError from "http-errors";
import { db } from "../../database";
import { getFolders } from "../../folder/service";
import type { Folder } from "../../folder/models";

export const getSharedFolders = async (
	archiveId: string,
	email: string,
): Promise<Folder[]> => {
	const result = await db
		.sql<{ folderId: string }>("archive.queries.get_shared_folders", {
			archiveId,
			email,
		})
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError(
				"Failed to retrieve shared folder IDs",
			);
		});

	const folderIds = result.rows.map((row) => row.folderId);

	return await getFolders(folderIds, email);
};
