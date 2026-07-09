import { logger } from "@stela/logger";
import createError from "http-errors";
import { db } from "../../database";
import { getFolders } from "../../folder/service";
import type { GetSharedFoldersResponse } from "../models";

const buildSharedFoldersNextPageUrl = (
	archiveId: string,
	pageSize: number,
	nextCursor: string,
): string => {
	const params = new URLSearchParams();
	params.set("pageSize", String(pageSize));
	params.set("cursor", nextCursor);
	return `https://${
		process.env["SITE_URL"] ?? ""
	}/api/v2/archives/${archiveId}/folders/shared?${params.toString()}`;
};

export const getSharedFolders = async (
	archiveId: string,
	email: string,
	pagination: {
		pageSize: number;
		cursor: string | undefined;
	},
): Promise<GetSharedFoldersResponse> => {
	const result = await db
		.sql<{ folderId: string; totalPages: number }>(
			"archive.queries.get_shared_folders",
			{
				archiveId,
				email,
				pageSize: pagination.pageSize,
				cursor: pagination.cursor,
			},
		)
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError(
				"Failed to retrieve shared folder IDs",
			);
		});

	const folderIds = result.rows.map((row) => row.folderId);
	const items = await getFolders(folderIds, email);

	const nextCursor = items[items.length - 1]?.folderId;

	return {
		items,
		pagination: {
			nextCursor,
			nextPage:
				nextCursor === undefined
					? undefined
					: buildSharedFoldersNextPageUrl(
							archiveId,
							pagination.pageSize,
							nextCursor,
						),
			totalPages: result.rows[0]?.totalPages ?? 0,
		},
	};
};
