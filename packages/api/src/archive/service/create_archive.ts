import createError from "http-errors";
import { logger } from "@stela/logger";
import { db } from "../../database.js";
import { createEventInTransaction } from "../../event/service.js";
import { createDefaultFolders } from "../../folder/service/create_default_folders.js";
import { processPendingInvites } from "../../invite/service.js";
import { sendShareInvitationAcceptanceNotification } from "../../email/index.js";
import { getArchive } from "./get_archive.js";
import {
	type Archive,
	type CreateArchiveRequest,
	ARCHIVE_TYPE_TO_DB_VALUE,
} from "../models.js";

export const createArchive = async (
	requestData: CreateArchiveRequest & {
		userAgent: string | undefined;
		type: "person" | "group" | "organization";
	},
): Promise<Archive> => {
	const { archiveId, acceptedInviteIds } = await db.transaction(
		async (transactionDb) => {
			const archiveResult = await transactionDb
				.sql<{
					archiveId: string;
					archiveNbr: string;
					archivePart: string;
				}>("archive.queries.create_archive", {
					archiveType: ARCHIVE_TYPE_TO_DB_VALUE[requestData.type],
				})
				.catch((err: unknown) => {
					logger.error(err);
					throw new createError.InternalServerError("Failed to create archive");
				});
			const { rows: archiveRows } = archiveResult;
			const [newArchive] = archiveRows;
			if (newArchive === undefined) {
				throw new createError.InternalServerError("Failed to create archive");
			}

			await transactionDb
				.sql("archive.queries.create_account_archive", {
					accountSubject: requestData.userSubjectFromAuthToken,
					archiveId: newArchive.archiveId,
				})
				.catch((err: unknown) => {
					logger.error(err);
					throw new createError.InternalServerError(
						"Failed to link account to archive",
					);
				});

			await createDefaultFolders(
				newArchive.archiveId,
				newArchive.archivePart,
				transactionDb,
			);

			await transactionDb
				.sql("archive.queries.create_initial_profile_item", {
					archiveId: newArchive.archiveId,
					name: requestData.name,
				})
				.catch((err: unknown) => {
					logger.error(err);
					throw new createError.InternalServerError(
						"Failed to create initial profile item",
					);
				});

			const processedInviteIds = await processPendingInvites(
				requestData.emailFromAuthToken,
				newArchive.archiveId,
				transactionDb,
			);

			await createEventInTransaction(
				{
					userSubjectFromAuthToken: requestData.userSubjectFromAuthToken,
					userEmailFromAuthToken: requestData.emailFromAuthToken,
					entity: "archive",
					action: "create",
					version: 1,
					entityId: newArchive.archiveId,
					ip: requestData.ip,
					userAgent: requestData.userAgent,
					body: { name: requestData.name, type: requestData.type },
				},
				transactionDb,
			);

			return {
				archiveId: newArchive.archiveId,
				acceptedInviteIds: processedInviteIds,
			};
		},
	);

	const archive = await getArchive(archiveId, requestData.emailFromAuthToken);

	if (acceptedInviteIds.length > 0) {
		await sendShareInvitationAcceptanceNotification(acceptedInviteIds).catch(
			(err: unknown) => {
				logger.error(err);
			},
		);
	}

	return archive;
};
