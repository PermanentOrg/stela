import createError from "http-errors";
import { logger } from "@stela/logger";
import { db } from "../../database.js";
import type {
	PublicArchiveSearchResult,
	SearchPublicArchivesResponse,
} from "../models.js";

const MAXIMUM_MATCHES_PER_ARCHIVE = 10;
// Shorter query words are ignored unless every word in the query is shorter.
const MINIMUM_SEARCH_WORD_LENGTH = 3;

interface PublicArchiveSearchRow extends PublicArchiveSearchResult {
	archiveId: string;
	totalPages: number;
}

const rowToResult = (
	row: PublicArchiveSearchRow,
): PublicArchiveSearchResult => {
	const { archiveId: _, totalPages: __, ...result } = row;
	return result;
};

const buildNextPageUrl = (
	query: string,
	cursor: string,
	pageSize: number,
): string => {
	const params = new URLSearchParams();
	params.set("query", query);
	params.set("pageSize", String(pageSize));
	params.set("cursor", cursor);
	return `https://${process.env["SITE_URL"] ?? ""}/api/v2/archives/public/search?${params.toString()}`;
};

export const searchPublicArchives = async (
	query: string,
	pagination: {
		pageSize: number;
		cursor: string | undefined;
	},
): Promise<SearchPublicArchivesResponse> => {
	const trimmedQuery = query.trim();
	const result = await db
		.sql<PublicArchiveSearchRow>("archive.queries.search_public_archives", {
			query: trimmedQuery,
			pageSize: pagination.pageSize,
			cursor: pagination.cursor,
			maxMatchesPerArchive: MAXIMUM_MATCHES_PER_ARCHIVE,
			minimumWordLength: MINIMUM_SEARCH_WORD_LENGTH,
		})
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError(
				"Failed to search public archives",
			);
		});

	const nextCursor = result.rows[result.rows.length - 1]?.archiveId;

	return {
		items: result.rows.map(rowToResult),
		pagination: {
			nextCursor,
			nextPage:
				nextCursor === undefined
					? undefined
					: buildNextPageUrl(trimmedQuery, nextCursor, pagination.pageSize),
			totalPages: result.rows[0]?.totalPages ?? 0,
		},
	};
};
