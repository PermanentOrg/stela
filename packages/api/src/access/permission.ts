import createError from "http-errors";
import { logger } from "@stela/logger";
import { AccessRole } from "./models";
import { db } from "../database";

const VIEWER_ACCESS_ROLE_RANK = 1;
const CONTRIBUTOR_ACCESS_ROLE_RANK = 2;
const EDITOR_ACCESS_ROLE_RANK = 3;
const CURATOR_ACCESS_ROLE_RANK = 4;
const MANAGER_ACCESS_ROLE_RANK = 5;
const OWNER_ACCESS_ROLE_RANK = 6;

export const accessRoleLessThan = (
	roleOne: AccessRole,
	roleTwo: AccessRole,
): boolean => {
	const accessRoleRank = new Map();
	accessRoleRank.set(AccessRole.Viewer, VIEWER_ACCESS_ROLE_RANK);
	accessRoleRank.set(AccessRole.Contributor, CONTRIBUTOR_ACCESS_ROLE_RANK);
	accessRoleRank.set(AccessRole.Editor, EDITOR_ACCESS_ROLE_RANK);
	accessRoleRank.set(AccessRole.Curator, CURATOR_ACCESS_ROLE_RANK);
	accessRoleRank.set(AccessRole.Manager, MANAGER_ACCESS_ROLE_RANK);
	accessRoleRank.set(AccessRole.Owner, OWNER_ACCESS_ROLE_RANK);

	return accessRoleRank.get(roleOne) < accessRoleRank.get(roleTwo);
};

const moreLimitedAccessRole = (
	roleOne: AccessRole | null,
	roleTwo: AccessRole | null,
): AccessRole | null => {
	if (roleOne === null) {
		return roleTwo;
	}
	if (roleTwo === null) {
		return roleOne;
	}
	return accessRoleLessThan(roleOne, roleTwo) ? roleOne : roleTwo;
};

export const getItemAccessRole = async (
	itemId: string,
	itemType: "folder" | "record",
	callerEmail: string,
): Promise<AccessRole> => {
	const query =
		itemType === "record"
			? "access.queries.get_record_access_role"
			: "access.queries.get_folder_access_role";
	const result = await db
		.sql<{
			archiveAccessRole: AccessRole;
			shareAccessRole: AccessRole;
		}>(query, { itemId, email: callerEmail })
		.catch((err: unknown) => {
			logger.error(err);
			throw createError.InternalServerError("Failed to access database");
		});

	if (result.rows[0] === undefined) {
		throw createError.NotFound();
	}

	const accessRole = result.rows
		.map((row) =>
			moreLimitedAccessRole(row.archiveAccessRole, row.shareAccessRole),
		)
		.reduce((accumulator, role) => {
			if (accumulator === null) {
				return role;
			}
			if (role === null) {
				return accumulator;
			}
			return accessRoleLessThan(accumulator, role) ? role : accumulator;
		});

	if (accessRole === null) {
		throw createError.NotFound();
	}

	return accessRole;
};

export const getRecordAccessRole = async (
	recordId: string,
	callerEmail: string,
): Promise<AccessRole> =>
	await getItemAccessRole(recordId, "record", callerEmail);

export const getFolderAccessRole = async (
	folderId: string,
	callerEmail: string,
): Promise<AccessRole> =>
	await getItemAccessRole(folderId, "folder", callerEmail);

export const isItemPublic = async (
	itemId: string,
	itemType: "folder" | "record",
): Promise<boolean> => {
	const query =
		itemType === "record"
			? "access.queries.is_record_public"
			: "access.queries.is_folder_public";
	const result = await db
		.sql<{ isPublic: boolean }>(query, { itemId })
		.catch((err: unknown) => {
			logger.error(err);
			throw createError.InternalServerError("Failed to access database");
		});
	return result.rows[0]?.isPublic ?? false;
};
