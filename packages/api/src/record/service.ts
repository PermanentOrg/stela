import createError from "http-errors";
import { logger } from "@stela/logger";
import type { TinyPg } from "tinypg";
import { db } from "../database.js";
import type {
	ArchiveRecord,
	ArchiveRecordRow,
	CreateRecordCopyRequest,
	GetRecordsResponse,
	PatchRecordRequest,
} from "./models.js";
import {
	getRecordAccessRole,
	accessRoleLessThan,
	getArchiveAccessRole,
} from "../access/permission.js";
import { AccessRole } from "../access/models.js";
import { shareLinkService } from "../share_link/service.js";
import type { ShareLink } from "../share_link/models.js";
import { getFolders } from "../folder/service.js";
import { type Folder, PrettyFolderType } from "../folder/models.js";
import { insertLocation, updateLocation } from "../location/service.js";

const mapRecordRow = (row: ArchiveRecordRow): ArchiveRecord => ({
	...row,
	size: +(row.size ?? 0),
	imageRatio: +(row.imageRatio ?? 0),
});

export const getRecords = async (requestQuery: {
	recordIds: string[] | undefined;
	archiveId?: string | undefined;
	accountEmail: string | undefined;
	shareToken?: string | undefined;
}): Promise<ArchiveRecord[]> => {
	const record = await db
		.sql<ArchiveRecordRow>("record.queries.get_records", {
			recordIds: requestQuery.recordIds ?? null,
			archiveId: requestQuery.archiveId ?? null,
			accountEmail: requestQuery.accountEmail,
			shareToken: requestQuery.shareToken,
			pageSize: null,
			cursor: undefined,
		})
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError("failed to retrieve records");
		});
	const records = record.rows.map<ArchiveRecord>(mapRecordRow);

	if (requestQuery.recordIds !== undefined) {
		// Our API contract remains that the order in which this endpoint returns
		// records is undefined. This ordering logic is implemented as a hotfix, and
		// should be removed when our clients no longer rely on this endpoint returning
		// records in a particular order.
		const recordsById = new Map<string, ArchiveRecord>();
		records.forEach((archiveRecord: ArchiveRecord) => {
			recordsById.set(archiveRecord.recordId, archiveRecord);
		});
		const recordsInOrder = requestQuery.recordIds
			.map((recordId: string) => recordsById.get(recordId))
			.filter(
				(archiveRecord: ArchiveRecord | undefined) =>
					archiveRecord !== undefined,
			);
		return recordsInOrder;
	}
	return records;
};

const buildRecordsNextPageUrl = (
	requestQuery: {
		recordIds: string[] | undefined;
		archiveId?: string | undefined;
		pageSize: number;
	},
	nextCursor: string,
): string => {
	const params = new URLSearchParams();
	requestQuery.recordIds?.forEach((recordId) => {
		params.append("recordIds[]", recordId);
	});
	if (requestQuery.archiveId !== undefined) {
		params.set("archiveId", requestQuery.archiveId);
	}
	params.set("pageSize", String(requestQuery.pageSize));
	params.set("cursor", nextCursor);
	return `https://${process.env["SITE_URL"] ?? ""}/api/v2/records?${params.toString()}`;
};

export const getRecordsPage = async (requestQuery: {
	recordIds: string[] | undefined;
	archiveId?: string | undefined;
	accountEmail: string | undefined;
	shareToken?: string | undefined;
	pageSize: number;
	cursor: string | undefined;
}): Promise<GetRecordsResponse> => {
	const result = await db
		.sql<ArchiveRecordRow & { rank: string; totalPages: number }>(
			"record.queries.get_records",
			{
				recordIds: requestQuery.recordIds ?? null,
				archiveId: requestQuery.archiveId ?? null,
				accountEmail: requestQuery.accountEmail,
				shareToken: requestQuery.shareToken,
				pageSize: requestQuery.pageSize,
				cursor: requestQuery.cursor,
			},
		)
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError("failed to retrieve records");
		});

	const items = result.rows.map((row) => {
		const { rank: _rank, totalPages: _totalPages, ...recordRow } = row;
		return mapRecordRow(recordRow);
	});

	const nextCursor = items[items.length - 1]?.id;

	return {
		items,
		pagination: {
			nextCursor,
			nextPage:
				nextCursor === undefined
					? undefined
					: buildRecordsNextPageUrl(requestQuery, nextCursor),
			totalPages: result.rows[0]?.totalPages ?? 0,
		},
	};
};

const validateCanPatchRecord = async (
	recordId: string,
	emailFromAuthToken: string,
): Promise<void> => {
	const accessRole = await getRecordAccessRole(recordId, emailFromAuthToken);
	if (accessRoleLessThan(accessRole, AccessRole.Editor)) {
		throw new createError.Forbidden(
			"User does not have permission to modify record.",
		);
	}
};

const getRecordLocationId = async (
	recordId: string,
	client: TinyPg,
): Promise<string | null> => {
	const result = await client
		.sql<{ locationId: string | null }>(
			"record.queries.get_record_location_id",
			{
				recordId,
			},
		)
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError("Failed to look up record");
		});
	const { rows } = result;
	const [row] = rows;
	if (row === undefined) {
		throw new createError.NotFound(`Record ${recordId} not found`);
	}
	return row.locationId;
};

export const patchRecord = async (
	recordId: string,
	recordData: PatchRecordRequest,
): Promise<string> => {
	await validateCanPatchRecord(recordId, recordData.emailFromAuthToken);

	return await db.transaction(async (transactionDb) => {
		let { locationId } = recordData;
		if (recordData.location !== undefined) {
			const currentLocationId = await getRecordLocationId(
				recordId,
				transactionDb,
			);
			if (currentLocationId === null) {
				locationId = BigInt(
					await insertLocation(recordData.location, transactionDb),
				);
			} else {
				await updateLocation(
					currentLocationId,
					recordData.location,
					transactionDb,
				);
				locationId = BigInt(currentLocationId);
			}
		}

		const result = await transactionDb
			.sql<{ recordId: string }>("record.queries.update_record", {
				recordId,
				displayName: recordData.displayName,
				locationId,
				setLocationIdToNull: locationId === null,
				description: recordData.description,
				setDescriptionToNull: recordData.description === null,
				displayTime: recordData.displayTime,
				setDisplayTimeToNull: recordData.displayTime === null,
				timezone: recordData.location?.timezone,
				setTimezoneToNull: recordData.location?.timezone === null,
			})
			.catch((err: unknown) => {
				logger.error(err);
				throw new createError.InternalServerError("Failed to update record");
			});

		if (result.rows[0] === undefined) {
			throw new createError.NotFound("Record not found");
		}
		return result.rows[0].recordId;
	});
};

const validateHasPermissionToCopyRecord = async (
	record: ArchiveRecord,
	destinationFolder: Folder,
	authenticatedEmail: string,
): Promise<void> => {
	const { archive: originArchive } = record;
	const { archive: destinationArchive } = destinationFolder;
	const destinationArchiveAccessRole = await getArchiveAccessRole(
		destinationArchive.id,
		authenticatedEmail,
	);
	if (originArchive.id !== destinationArchive.id) {
		const originArchiveAccessRole = await getArchiveAccessRole(
			originArchive.id,
			authenticatedEmail,
		);
		if (accessRoleLessThan(originArchiveAccessRole, AccessRole.Owner)) {
			throw new createError.Forbidden(
				"User does not have permission to copy to another archive",
			);
		}
	}
	if (
		[
			PrettyFolderType.AppRoot,
			PrettyFolderType.App,
			PrettyFolderType.PublicRoot,
			PrettyFolderType.Public,
		].includes(destinationFolder.type) &&
		accessRoleLessThan(destinationArchiveAccessRole, AccessRole.Manager)
	) {
		throw new createError.Forbidden(
			"User does not have permission to copy to the public or app workspace",
		);
	} else if (
		accessRoleLessThan(destinationArchiveAccessRole, AccessRole.Curator)
	) {
		throw new createError.Forbidden(
			"User does not have permission to copy records",
		);
	}
};

export const createRecordCopy = async (
	recordId: string,
	requestBody: CreateRecordCopyRequest,
	userAgent?: string,
): Promise<ArchiveRecord> => {
	const [record] = await getRecords({
		recordIds: [recordId],
		accountEmail: requestBody.emailFromAuthToken,
	});
	if (record === undefined) {
		throw new createError.NotFound("Record not found");
	}

	const [destinationFolder] = await getFolders(
		[requestBody.destinationFolderId],
		requestBody.emailFromAuthToken,
	);
	if (destinationFolder === undefined) {
		throw new createError.NotFound("Destination folder not found");
	}

	const { size: recordSize } = record;

	await validateHasPermissionToCopyRecord(
		record,
		destinationFolder,
		requestBody.emailFromAuthToken,
	);

	const copiedRecordId = await db.transaction(async (transactionDb) => {
		const availableStorage = await transactionDb
			.sql<{ spaceLeft: string }>(
				"storage.queries.get_account_space_for_update",
				{
					email: requestBody.emailFromAuthToken,
				},
			)
			.catch((err: unknown) => {
				logger.error(err);
				throw new createError.InternalServerError(
					"Failed to look up account space",
				);
			});
		if (availableStorage.rows[0] === undefined) {
			logger.error("Empty response from account_space query");
			throw new createError.InternalServerError(
				"Failed to look up account space",
			);
		} else if (+availableStorage.rows[0].spaceLeft < recordSize) {
			throw new createError.BadRequest("Not enough storage to make a copy");
		}

		const {
			rows: [recordCopy],
		} = await transactionDb
			.sql<{ recordId: string }>("record.queries.copy_record", {
				destinationArchiveId: destinationFolder.archive.id,
				destinationFolderId: destinationFolder.folderId,
				originalRecordId: record.recordId,
				callerEmail: requestBody.emailFromAuthToken,
				destinationIsPublic: [
					PrettyFolderType.PublicRoot,
					PrettyFolderType.Public,
				].includes(destinationFolder.type),
				callerIp: requestBody.ip,
				callerUserAgent: userAgent,
			})
			.catch((err: unknown) => {
				logger.error(err);
				throw new createError.InternalServerError("Failed to copy record");
			});
		if (recordCopy === undefined) {
			logger.error("Failed to copy record");
			throw new createError.InternalServerError("Failed to copy record");
		}
		return recordCopy.recordId;
	});

	const copy = await getRecords({
		recordIds: [copiedRecordId],
		accountEmail: requestBody.emailFromAuthToken,
	});
	if (copy[0] === undefined) {
		logger.error(
			`Cannot find newly created record copy with ID ${copiedRecordId}`,
		);
		throw new createError.InternalServerError(
			"Cannot find newly created record copy",
		);
	}

	return copy[0];
};

export const getRecordShareLinks = async (
	email: string,
	recordId: string,
): Promise<ShareLink[]> => {
	const recordShareLinkIds = await db
		.sql<{ id: string }>("record.queries.get_record_share_links", {
			email,
			recordId,
		})
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError(
				"Failed to get record share links",
			);
		});

	const shareLinkIds = recordShareLinkIds.rows.map((row) => row.id);
	const shareLinks = await shareLinkService.getShareLinks(
		email,
		[],
		shareLinkIds,
		{ pageSize: null, cursor: undefined },
	);
	return shareLinks.items;
};
