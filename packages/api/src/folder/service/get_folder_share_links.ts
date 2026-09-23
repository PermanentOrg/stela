import createError from "http-errors";
import { logger } from "@stela/logger";
import { db } from "../../database.js";
import { shareLinkService } from "../../share_link/service.js";
import type { ShareLink } from "../../share_link/models.js";

export const getFolderShareLinks = async (
	email: string,
	folderId: string,
): Promise<ShareLink[]> => {
	const folderShareLinkIds = await db
		.sql<{ id: string }>("folder.queries.get_folder_share_links", {
			email,
			folderId,
		})
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError(
				"Failed to get folder share links",
			);
		});

	const shareLinkIds = folderShareLinkIds.rows.map((row) => row.id);
	const shareLinks = await shareLinkService.getShareLinks(
		email,
		[],
		shareLinkIds,
		{ pageSize: null, cursor: undefined },
	);
	return shareLinks.items;
};
