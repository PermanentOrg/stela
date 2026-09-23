import createError from "http-errors";
import { logger } from "@stela/logger";
import type { TinyPg } from "tinypg";
import { db } from "../../database.js";
import type { PatchFolderRequest } from "../models.js";
import {
	getFolderAccessRole,
	accessRoleLessThan,
} from "../../access/permission.js";
import { AccessRole } from "../../access/models.js";
import { insertLocation, updateLocation } from "../../location/service.js";

const validateCanPatchFolder = async (
	folderId: string,
	emailFromAuthToken: string,
): Promise<void> => {
	const accessRole = await getFolderAccessRole(folderId, emailFromAuthToken);
	if (accessRoleLessThan(accessRole, AccessRole.Editor)) {
		throw new createError.Forbidden(
			"User does not have permission to modify folder.",
		);
	}
};

const getFolderLocationId = async (
	folderId: string,
	client: TinyPg,
): Promise<string | null> => {
	const result = await client
		.sql<{ locationId: string | null }>(
			"folder.queries.get_folder_location_id",
			{
				folderId,
			},
		)
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError("Failed to look up folder");
		});
	const { rows } = result;
	const [row] = rows;
	if (row === undefined) {
		throw new createError.NotFound(`Folder ${folderId} not found`);
	}
	return row.locationId;
};

export const patchFolder = async (
	folderId: string,
	folderData: PatchFolderRequest,
): Promise<string> => {
	await validateCanPatchFolder(folderId, folderData.emailFromAuthToken);

	return await db.transaction(async (transactionDb) => {
		let locationId: string | null = null;
		if (folderData.location !== undefined) {
			const currentLocationId = await getFolderLocationId(
				folderId,
				transactionDb,
			);
			if (currentLocationId === null) {
				locationId = await insertLocation(folderData.location, transactionDb);
			} else {
				await updateLocation(
					currentLocationId,
					folderData.location,
					transactionDb,
				);
				locationId = currentLocationId;
			}
		}

		const result = await transactionDb
			.sql<{ folderId: string }>("folder.queries.update_folder", {
				folderId,
				displayDate: folderData.displayDate,
				setDisplayDateToNull: folderData.displayDate === null,
				displayEndDate: folderData.displayEndDate,
				setDisplayEndDateToNull: folderData.displayEndDate === null,
				displayTime: folderData.displayTime,
				setDisplayTimeToNull: folderData.displayTime === null,
				timezone: folderData.location?.timezone,
				setTimezoneToNull: folderData.location?.timezone === null,
				locationId,
			})
			.catch((err: unknown) => {
				logger.error(err);
				throw new createError.InternalServerError("Failed to update folder");
			});

		if (result.rows[0] === undefined) {
			throw new createError.NotFound("Folder not found");
		}
		return result.rows[0].folderId;
	});
};
