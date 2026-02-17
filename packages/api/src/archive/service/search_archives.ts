import createError from "http-errors";
import { logger } from "@stela/logger";
import { db } from "../../database";
import type { Archive, GetArchivesResponse } from "../models";
import type { AccessRole, ArchiveMembershipRole } from "../../access/models";
import {
	accessRoleToArchiveMembershipRole,
	archiveMembershipRoleToAccessRole,
} from "../../access/models";

interface ArchiveRow extends Omit<Archive, "callerMembershipRole"> {
	callerMembershipRole?: AccessRole | null;
	totalPages: number;
}

export const searchArchives = async (
	filters: {
		searchQuery?: string | undefined;
		callerMembershipRole?:
			| ArchiveMembershipRole
			| ArchiveMembershipRole[]
			| undefined;
	},
	pagination: {
		pageSize: number;
		cursor: string | undefined;
	},
	isAdmin: boolean,
	userEmail: string | undefined,
): Promise<GetArchivesResponse> => {
	const callerArchiveMembershipRoles =
		filters.callerMembershipRole === undefined
			? []
			: Array.isArray(filters.callerMembershipRole)
				? filters.callerMembershipRole
				: [filters.callerMembershipRole];

	const callerMembershipRoles = callerArchiveMembershipRoles.map(
		archiveMembershipRoleToAccessRole,
	);

	const result = await db
		.sql<ArchiveRow>("archive.queries.search_archives", {
			searchQuery: filters.searchQuery ?? "",
			callerMembershipRoles,
			isAdmin,
			pageSize: pagination.pageSize,
			cursor: pagination.cursor,
			userEmail,
		})
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError("Failed to search archives");
		});

	const archives: Archive[] = result.rows.map((row) => ({
		...row,
		callerMembershipRole:
			row.callerMembershipRole === null ||
			row.callerMembershipRole === undefined
				? null
				: accessRoleToArchiveMembershipRole(row.callerMembershipRole),
	}));
	const nextCursor = archives[archives.length - 1]?.archiveId;

	const buildNextPageUrl = (): string | undefined => {
		if (nextCursor === undefined) {
			return undefined;
		}
		const baseUrl = `https://${process.env["SITE_URL"] ?? ""}/api/v2/archive`;
		const params = new URLSearchParams();
		if (filters.searchQuery !== undefined) {
			params.append("searchQuery", filters.searchQuery);
		}
		for (const role of callerArchiveMembershipRoles) {
			params.append("callerMembershipRole", role);
		}
		params.append("pageSize", String(pagination.pageSize));
		params.append("cursor", nextCursor);
		return `${baseUrl}?${params.toString()}`;
	};

	return {
		items: archives,
		pagination: {
			nextCursor,
			nextPage: buildNextPageUrl(),
			totalPages: result.rows[0] === undefined ? 0 : result.rows[0].totalPages,
		},
	};
};
