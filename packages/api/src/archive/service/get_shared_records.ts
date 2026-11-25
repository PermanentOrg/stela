import { logger } from "@stela/logger";
import createError from "http-errors";
import { db } from "../../database.js";
import { getRecords } from "../../record/service.js";
import type { GetRecordsResponse } from "../../record/models.js";

const buildSharedRecordsNextPageUrl = (
	archiveId: string,
	pageSize: number,
	nextCursor: string,
): string => {
	const params = new URLSearchParams();
	params.set("pageSize", String(pageSize));
	params.set("cursor", nextCursor);
	return `https://${
		process.env["SITE_URL"] ?? ""
	}/api/v2/archives/${archiveId}/records/shared?${params.toString()}`;
};

export const getSharedRecords = async (
	archiveId: string,
	email: string,
	pagination: {
		pageSize: number;
		cursor: string | undefined;
	},
): Promise<GetRecordsResponse> => {
	const result = await db
		.sql<{ recordId: string; totalPages: number }>(
			"archive.queries.get_shared_records",
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
				"Failed to retrieve shared record IDs",
			);
		});

	const recordIds = result.rows.map((row) => row.recordId);
	const items = await getRecords({ recordIds, accountEmail: email });

	const nextCursor = items[items.length - 1]?.recordId;

	return {
		items,
		pagination: {
			nextCursor,
			nextPage:
				nextCursor === undefined
					? undefined
					: buildSharedRecordsNextPageUrl(
							archiveId,
							pagination.pageSize,
							nextCursor,
						),
			totalPages: result.rows[0]?.totalPages ?? 0,
		},
	};
};
