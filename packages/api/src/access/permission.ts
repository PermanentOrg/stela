import createError from "http-errors";
import { logger } from "@stela/logger";
import {
	AccessRole,
	type ArchiveMembershipRole,
	accessRoleToArchiveMembershipRole,
} from "./models.js";
import { db } from "../database.js";

const VIEWER_ACCESS_ROLE_RANK = 1;
const CONTRIBUTOR_ACCESS_ROLE_RANK = 2;
const EDITOR_ACCESS_ROLE_RANK = 3;
const CURATOR_ACCESS_ROLE_RANK = 4;
const MANAGER_ACCESS_ROLE_RANK = 5;
const OWNER_ACCESS_ROLE_RANK = 6;

const accessRoleRank = new Map();
accessRoleRank.set(AccessRole.Viewer, VIEWER_ACCESS_ROLE_RANK);
accessRoleRank.set(AccessRole.Contributor, CONTRIBUTOR_ACCESS_ROLE_RANK);
accessRoleRank.set(AccessRole.Editor, EDITOR_ACCESS_ROLE_RANK);
accessRoleRank.set(AccessRole.Curator, CURATOR_ACCESS_ROLE_RANK);
accessRoleRank.set(AccessRole.Manager, MANAGER_ACCESS_ROLE_RANK);
accessRoleRank.set(AccessRole.Owner, OWNER_ACCESS_ROLE_RANK);

export const accessRoleLessThan = (
	roleOne: AccessRole,
	roleTwo: AccessRole,
): boolean => accessRoleRank.get(roleOne) < accessRoleRank.get(roleTwo);

export const leastPermissiveAccessRole = (
	roleOne: AccessRole | null | undefined,
	roleTwo: AccessRole | null | undefined,
): AccessRole | null => {
	if (roleOne === null || roleOne === undefined) {
		return roleTwo ?? null;
	}
	if (roleTwo === null || roleTwo === undefined) {
		return roleOne;
	}
	return accessRoleLessThan(roleOne, roleTwo) ? roleOne : roleTwo;
};

export const mostPermissiveAccessRole = (
	roles: Array<AccessRole | null | undefined>,
): AccessRole | null =>
	roles.reduce<AccessRole | null>((accumulator, role) => {
		if (role === null || role === undefined) {
			return accumulator;
		}
		if (accumulator === null) {
			return role;
		}
		return accessRoleLessThan(accumulator, role) ? role : accumulator;
	}, null);

export interface ShareAccessRolePair {
	archiveAccessRole: AccessRole;
	shareAccessRole: AccessRole;
}

export const resolveAccessRole = (input: {
	archiveAccessRole: AccessRole | null;
	shareAccessRoles: ShareAccessRolePair[] | null;
	shareTokenGrantsAccess: boolean;
	isPublic: boolean;
}): ArchiveMembershipRole => {
	const roles: Array<AccessRole | null> = [
		input.archiveAccessRole,
		...(input.shareAccessRoles ?? []).map((share) =>
			leastPermissiveAccessRole(share.archiveAccessRole, share.shareAccessRole),
		),
	];
	if (input.shareTokenGrantsAccess) {
		roles.push(AccessRole.Viewer);
	}
	if (input.isPublic) {
		roles.push(AccessRole.Viewer);
	}

	const accessRole = mostPermissiveAccessRole(roles);
	if (accessRole === null) {
		// Should be unreachable: the SQL WHERE clause that selects a row already
		// guarantees at least one access path applies.
		throw createError.InternalServerError(
			"Unable to resolve caller's access role for item",
		);
	}
	return accessRoleToArchiveMembershipRole(accessRole);
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
			shareAccessRole: AccessRole | null;
		}>(query, { itemId, email: callerEmail })
		.catch((err: unknown) => {
			logger.error(err);
			throw createError.InternalServerError("Failed to access database");
		});

	if (result.rows[0] === undefined) {
		throw createError.NotFound();
	}

	const accessRole = mostPermissiveAccessRole(
		result.rows.map((row) =>
			leastPermissiveAccessRole(row.archiveAccessRole, row.shareAccessRole),
		),
	);

	if (accessRole === null) {
		throw createError.NotFound();
	}

	return accessRole;
};

export const getArchiveAccessRole = async (
	archiveId: string,
	callerEmail: string,
): Promise<AccessRole> => {
	const result = await db
		.sql<{
			accessRole: AccessRole;
		}>("access.queries.get_archive_access_role", {
			archiveId,
			email: callerEmail,
		})
		.catch((err: unknown) => {
			logger.error(err);
			throw createError.InternalServerError("Failed to access database");
		});

	if (result.rows[0] === undefined) {
		throw createError.NotFound();
	}

	return result.rows[0].accessRole;
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
