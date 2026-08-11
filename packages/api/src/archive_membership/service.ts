import createError from "http-errors";
import { logger } from "@stela/logger";
import { db } from "../database.js";
import {
	accessRoleLessThan,
	getArchiveAccessRole,
} from "../access/permission.js";
import {
	AccessRole,
	archiveMembershipRoleToAccessRole,
} from "../access/models.js";
import type {
	ArchiveMembership,
	UpdateArchiveMembershipRequest,
	DeleteArchiveMembershipRequest,
} from "./models.js";
import { createEventInTransaction } from "../event/service.js";

interface PermissionsDataRow {
	archiveId: string;
	accountEmail: string;
	isOwner: boolean;
}

interface DeletedArchiveMembershipRow {
	id: string;
	accountId: string;
	archiveId: string;
	accessRole: string | null;
	position: string;
	type: string;
	status: string;
	createdAt: Date | null;
	updatedAt: Date | null;
}

const validateUpdateArchiveMembershipPermissions = async (
	archiveMembershipId: string,
	requestData: UpdateArchiveMembershipRequest,
): Promise<void> => {
	const permissionsResult = await db
		.sql<PermissionsDataRow>(
			"archive_membership.queries.get_account_membership_permissions_data",
			{ id: archiveMembershipId },
		)
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError("Failed to access database");
		});

	if (permissionsResult.rows[0] === undefined) {
		throw new createError.NotFound("Archive membership not found");
	}

	const {
		rows: [{ archiveId, accountEmail, isOwner: archiveMembershipIsOwnerLevel }],
	} = permissionsResult;

	if (requestData.accessRole !== undefined) {
		const callerRole = await getArchiveAccessRole(
			archiveId,
			requestData.emailFromAuthToken,
		);
		if (
			accessRoleLessThan(callerRole, AccessRole.Manager) ||
			archiveMembershipIsOwnerLevel
		) {
			throw new createError.Forbidden(
				"Caller does not have sufficient permissions to update access role",
			);
		}
	}

	if (
		requestData.status !== undefined &&
		requestData.emailFromAuthToken !== accountEmail
	) {
		throw new createError.Forbidden(
			"Only the account in the membership can accept a membership",
		);
	}
};

const updateArchiveMembership = async (
	id: string,
	requestData: UpdateArchiveMembershipRequest,
): Promise<ArchiveMembership> => {
	await validateUpdateArchiveMembershipPermissions(id, requestData);

	const dbAccessRole =
		requestData.accessRole === undefined
			? null
			: archiveMembershipRoleToAccessRole(requestData.accessRole);
	const dbStatus = requestData.status === "ok" ? "status.generic.ok" : null;

	await db.transaction(async (transactionDb) => {
		const updateResult = await transactionDb
			.sql<{
				id: string;
			}>("archive_membership.queries.update_archive_membership", {
				id,
				accessRole: dbAccessRole,
				status: dbStatus,
			})
			.catch((err: unknown) => {
				logger.error(err);
				throw new createError.InternalServerError(
					"Failed to update archive membership",
				);
			});
		if (updateResult.rows[0] === undefined) {
			throw new createError.NotFound("Archive membership not found");
		}

		await createEventInTransaction(
			{
				userSubjectFromAuthToken: requestData.userSubjectFromAuthToken,
				userEmailFromAuthToken: requestData.emailFromAuthToken,
				entity: "archive_membership",
				action: "update",
				version: 1,
				entityId: id,
				ip: requestData.ip ?? "",
				userAgent: requestData.userAgent,
				body: {
					newAccessRole: requestData.accessRole,
					newStatus: requestData.status,
				},
			},
			transactionDb,
		);
	});

	const updatedResult = await db
		.sql<ArchiveMembership>(
			"archive_membership.queries.get_archive_membership",
			{ id },
		)
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError("Failed to access database");
		});

	if (updatedResult.rows[0] === undefined) {
		throw new createError.InternalServerError(
			"Failed to retrieve updated archive membership",
		);
	}
	if (
		updatedResult.rows.length > 1 ||
		updatedResult.rows[0].archive.name === null
	) {
		throw new createError.InternalServerError(
			"Archive membership data corrupted",
		);
	}

	return updatedResult.rows[0];
};

const validateDeleteArchiveMembershipPermissions = async (
	archiveMembershipId: string,
	requestData: DeleteArchiveMembershipRequest,
): Promise<void> => {
	const permissionsResult = await db
		.sql<PermissionsDataRow>(
			"archive_membership.queries.get_account_membership_permissions_data",
			{ id: archiveMembershipId },
		)
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError("Failed to access database");
		});

	if (permissionsResult.rows[0] === undefined) {
		throw new createError.NotFound("Archive membership not found");
	}

	const {
		rows: [{ archiveId, accountEmail, isOwner: archiveMembershipIsOwnerLevel }],
	} = permissionsResult;

	if (archiveMembershipIsOwnerLevel) {
		throw new createError.Forbidden(
			"Cannot delete an owner-level archive membership",
		);
	}

	if (requestData.emailFromAuthToken === accountEmail) {
		return;
	}

	const callerRole = await getArchiveAccessRole(
		archiveId,
		requestData.emailFromAuthToken,
	);
	if (accessRoleLessThan(callerRole, AccessRole.Manager)) {
		throw new createError.Forbidden(
			"Caller does not have sufficient permissions to delete this archive membership",
		);
	}
};

const deleteArchiveMembership = async (
	id: string,
	requestData: DeleteArchiveMembershipRequest,
): Promise<void> => {
	await validateDeleteArchiveMembershipPermissions(id, requestData);

	await db.transaction(async (transactionDb) => {
		const deleteResult = await transactionDb
			.sql<DeletedArchiveMembershipRow>(
				"archive_membership.queries.delete_archive_membership",
				{ id },
			)
			.catch((err: unknown) => {
				logger.error(err);
				throw new createError.InternalServerError(
					"Failed to delete archive membership",
				);
			});

		if (deleteResult.rows[0] === undefined) {
			throw new createError.NotFound("Archive membership not found");
		}

		const {
			rows: [deletedArchiveMembership],
		} = deleteResult;

		await createEventInTransaction(
			{
				userSubjectFromAuthToken: requestData.userSubjectFromAuthToken,
				userEmailFromAuthToken: requestData.emailFromAuthToken,
				entity: "archive_membership",
				action: "delete",
				version: 1,
				entityId: id,
				ip: requestData.ip ?? "",
				userAgent: requestData.userAgent,
				body: {
					deletedArchiveMembership,
				},
			},
			transactionDb,
		);
	});
};

export const archiveMembershipService = {
	updateArchiveMembership,
	deleteArchiveMembership,
};
