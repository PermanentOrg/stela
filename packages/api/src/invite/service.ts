import createError from "http-errors";
import { logger } from "@stela/logger";
import type { TinyPg } from "tinypg";
import { AccessRole } from "../access/models.js";
import type { PendingInviteShare } from "./models.js";
import { accessRoleLessThan } from "../access/permission.js";

const ACCEPTED_STATUS = "status.invite.accepted";

const VALID_ACCESS_ROLES = new Set<string>(Object.values(AccessRole));

export const processPendingInvites = async (
	email: string,
	archiveId: string,
	db: TinyPg,
): Promise<string[]> => {
	const pendingInvitesResult = await db
		.sql<PendingInviteShare>("invite.queries.get_pending_invites_by_email", {
			email,
		})
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError(
				"Failed to look up pending invites",
			);
		});

	const { rows: pendingInvites } = pendingInvitesResult;
	const inviteIds = pendingInvites.map((invite) => invite.inviteId);
	if (inviteIds.length === 0) {
		return [];
	}
	const accessRoleByFolderLinkId = new Map<string, AccessRole>();
	const actionablePendingInvites = pendingInvites.filter((inviteShare) => {
		const { folderLinkId, accessRole } = inviteShare;
		if (folderLinkId === null || accessRole === null) {
			return false;
		}
		if (!VALID_ACCESS_ROLES.has(accessRole)) {
			logger.error(
				`Skipping invite_share ${inviteShare.inviteShareId}: unrecognized access role "${accessRole}"`,
			);
			return false;
		}

		const folderLinkIdCurrentAccessRole =
			accessRoleByFolderLinkId.get(folderLinkId);
		if (
			folderLinkIdCurrentAccessRole === undefined ||
			accessRoleLessThan(folderLinkIdCurrentAccessRole, accessRole)
		) {
			accessRoleByFolderLinkId.set(folderLinkId, accessRole);
		}

		return true;
	});

	if (accessRoleByFolderLinkId.size > 0) {
		const folderLinkIds = [...accessRoleByFolderLinkId.keys()];
		const accessRoles = [...accessRoleByFolderLinkId.values()];

		await db
			.sql("invite.queries.create_share", {
				folderLinkIds,
				accessRoles,
				archiveId,
			})
			.catch((err: unknown) => {
				logger.error(err);
				throw new createError.InternalServerError("Failed to create share");
			});

		await db
			.sql("invite.queries.create_access_grants_recursive", {
				folderLinkIds,
				accessRoles,
				archiveId,
			})
			.catch((err: unknown) => {
				logger.error(err);
				throw new createError.InternalServerError(
					"Failed to grant access to shared folder",
				);
			});
	}

	const inviteShareIds = pendingInvites.map(
		(inviteShare) => inviteShare.inviteShareId,
	);
	if (inviteShareIds.length > 0) {
		await db
			.sql("invite.queries.update_invite_share_status", {
				inviteShareIds,
				status: ACCEPTED_STATUS,
			})
			.catch((err: unknown) => {
				logger.error(err);
				throw new createError.InternalServerError(
					"Failed to update invite share status",
				);
			});
	}

	await db
		.sql("invite.queries.update_invite_status", {
			inviteIds,
			status: ACCEPTED_STATUS,
		})
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError(
				"Failed to update invite status",
			);
		});

	return actionablePendingInvites.map((inviteShare) => inviteShare.inviteId);
};
