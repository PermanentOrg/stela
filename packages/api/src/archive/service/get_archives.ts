import createError from "http-errors";
import { logger } from "@stela/logger";
import { db } from "../../database.js";
import type { Archive, GetArchivesResponse } from "../models.js";
import type { AccessRole } from "../../access/models.js";
import { accessRoleToArchiveMembershipRole } from "../../access/models.js";

interface ArchiveRow extends Omit<Archive, "callerMembershipRole"> {
	callerMembershipRole?: AccessRole | null;
	totalPages: number;
}

const buildArchivesNextPageUrl = (
	requestQuery: {
		archiveIds: string[] | undefined;
		pageSize: number;
	},
	nextCursor: string,
): string => {
	const params = new URLSearchParams();
	requestQuery.archiveIds?.forEach((archiveId) => {
		params.append("archiveIds[]", archiveId);
	});
	params.set("pageSize", String(requestQuery.pageSize));
	params.set("cursor", nextCursor);
	return `https://${process.env["SITE_URL"] ?? ""}/api/v2/archives?${params.toString()}`;
};

export const getArchives = async (requestQuery: {
	archiveIds: string[] | undefined;
	accountEmail: string | undefined;
	pageSize: number;
	cursor: string | undefined;
}): Promise<GetArchivesResponse> => {
	const result = await db
		.sql<ArchiveRow>("archive.queries.get_archives", {
			archiveIds: requestQuery.archiveIds ?? null,
			accountEmail: requestQuery.accountEmail,
			pageSize: requestQuery.pageSize,
			cursor: requestQuery.cursor,
		})
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError("failed to retrieve archives");
		});

	const items: Archive[] = result.rows.map((row) => {
		const { totalPages: _totalPages, ...archiveRow } = row;
		return {
			...archiveRow,
			callerMembershipRole:
				archiveRow.callerMembershipRole === null ||
				archiveRow.callerMembershipRole === undefined
					? null
					: accessRoleToArchiveMembershipRole(archiveRow.callerMembershipRole),
		};
	});

	const nextCursor = items[items.length - 1]?.archiveId;

	return {
		items,
		pagination: {
			nextCursor,
			nextPage:
				nextCursor === undefined
					? undefined
					: buildArchivesNextPageUrl(
							{
								archiveIds: requestQuery.archiveIds,
								pageSize: requestQuery.pageSize,
							},
							nextCursor,
						),
			totalPages: result.rows[0]?.totalPages ?? 0,
		},
	};
};
