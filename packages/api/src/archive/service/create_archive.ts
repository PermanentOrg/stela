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
		type: "person" | "group" | "organization";
	},
	callerData: {
		email: string;
		subject: string;
		ip: string;
		userAgent: string | undefined;
	},
): Promise<Archive> => {
	const { archiveId, acceptedInviteIds } = await db.transaction(
		async (transactionDb) => {
			await transactionDb.sql("archive.queries.acquire_create_archive_lock");
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
					accountSubject: callerData.subject,
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
				callerData.email,
				newArchive.archiveId,
				transactionDb,
			);

			await createEventInTransaction(
				{
					userSubjectFromAuthToken: callerData.subject,
					userEmailFromAuthToken: callerData.email,
					entity: "archive",
					action: "create",
					version: 1,
					entityId: newArchive.archiveId,
					ip: callerData.ip,
					userAgent: callerData.userAgent,
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

	const archive = await getArchive(archiveId, callerData.email);

	if (acceptedInviteIds.length > 0) {
		await sendShareInvitationAcceptanceNotification(acceptedInviteIds).catch(
			(err: unknown) => {
				logger.error(err);
			},
		);
	}

	return archive;
};
