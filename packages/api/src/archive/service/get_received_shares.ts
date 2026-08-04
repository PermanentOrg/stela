import { logger } from "@stela/logger";
import createError from "http-errors";
import { db } from "../../database.js";
import type { GetReceivedSharesResponse } from "../models.js";
import type { Share } from "../../share/models.js";

interface ReceivedShareRow extends Share {
	totalPages: number;
}

const rowToShare = (row: ReceivedShareRow): Share => {
	const { totalPages: _, ...share } = row;
	return share;
};

const buildReceivedSharesNextPageUrl = (
	archiveId: string,
	cursor: string,
	pageSize: number,
): string => {
	const params = new URLSearchParams();
	params.set("cursor", cursor);
	params.set("pageSize", String(pageSize));
	return `https://${process.env["SITE_URL"] ?? ""}/api/v2/archives/${archiveId}/received-shares?${params.toString()}`;
};

export const getReceivedShares = async (
	archiveId: string,
	email: string,
	pagination: {
		pageSize: number;
		cursor: string | undefined;
	},
): Promise<GetReceivedSharesResponse> => {
	const result = await db
		.sql<ReceivedShareRow>("archive.queries.get_received_shares", {
			archiveId,
			email,
			pageSize: pagination.pageSize,
			cursor: pagination.cursor,
		})
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError(
				"Failed to retrieve received shares",
			);
		});

	const items = result.rows.map(rowToShare);
	const nextCursor = items[items.length - 1]?.id;

	return {
		items,
		pagination: {
			nextCursor,
			nextPage:
				nextCursor === undefined
					? undefined
					: buildReceivedSharesNextPageUrl(
							archiveId,
							nextCursor,
							pagination.pageSize,
						),
			totalPages: result.rows[0]?.totalPages ?? 0,
		},
	};
};
