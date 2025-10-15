import createError from "http-errors";
import { logger } from "@stela/logger";
import { db } from "../../database";
import type { Archive, GetArchivesResponse } from "../models";

export const searchArchives = async (
	searchQuery: string,
	pagination: {
		pageSize: number;
		cursor: string | undefined;
	},
	isAdmin: boolean,
	userEmail: string | undefined,
): Promise<GetArchivesResponse> => {
	const result = await db
		.sql<Archive & { totalPages: number }>("archive.queries.search_archives", {
			searchQuery,
			isAdmin,
			pageSize: pagination.pageSize,
			cursor: pagination.cursor,
			userEmail,
		})
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError("Failed to search archives");
		});

	const { rows: archives } = result;
	const nextCursor = archives[archives.length - 1]?.archiveId;

	return {
		items: archives,
		pagination: {
			nextCursor,
			nextPage:
				nextCursor === undefined
					? undefined
					: `https://${
							process.env["SITE_URL"] ?? ""
						}/api/v2/archive?searchQuery=${encodeURIComponent(searchQuery)}&pageSize=${pagination.pageSize}&cursor=${nextCursor}`,
			totalPages: result.rows[0] === undefined ? 0 : result.rows[0].totalPages,
		},
	};
};
