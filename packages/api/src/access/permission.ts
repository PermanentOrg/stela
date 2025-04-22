import createError from "http-errors";
import { logger } from "@stela/logger";
import { AccessRole } from "./models";
import { db } from "../database";

export const accessRoleLessThan = (
	roleOne: AccessRole,
	roleTwo: AccessRole,
): boolean => {
	const accessRoleRank = new Map();
	accessRoleRank.set(AccessRole.Viewer, 1);
	accessRoleRank.set(AccessRole.Contributor, 2);
	accessRoleRank.set(AccessRole.Editor, 3);
	accessRoleRank.set(AccessRole.Curator, 4);
	accessRoleRank.set(AccessRole.Manager, 5);
	accessRoleRank.set(AccessRole.Owner, 6);
	accessRoleRank.set(AccessRole.Admin, 7);

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
		.catch((err) => {
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
): Promise<AccessRole> => getItemAccessRole(recordId, "record", callerEmail);

export const getFolderAccessRole = async (
	folderId: string,
	callerEmail: string,
): Promise<AccessRole> => getItemAccessRole(folderId, "folder", callerEmail);

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
		.catch((err) => {
			logger.error(err);
			throw createError.InternalServerError("Failed to access database");
		});
	return result.rows[0]?.isPublic ?? false;
};
