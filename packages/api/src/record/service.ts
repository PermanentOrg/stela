import createError from "http-errors";
import { logger } from "@stela/logger";
import { db } from "../database";
import type {
	ArchiveRecord,
	ArchiveRecordRow,
	PatchRecordRequest,
} from "./models";
import { getRecordAccessRole, accessRoleLessThan } from "../access/permission";
import { AccessRole } from "../access/models";
import { shareLinkService } from "../share_link/service";
import type { ShareLink } from "../share_link/models";

export const getRecords = async (requestQuery: {
	recordIds: string[] | undefined;
	archiveId: string | undefined;
	accountEmail: string | undefined;
	shareToken?: string | undefined;
}): Promise<ArchiveRecord[]> => {
	const record = await db
		.sql<ArchiveRecordRow>("record.queries.get_records", {
			recordIds: requestQuery.recordIds ?? null,
			archiveId: requestQuery.archiveId ?? null,
			accountEmail: requestQuery.accountEmail,
			shareToken: requestQuery.shareToken,
		})
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError("failed to retrieve records");
		});
	const records = record.rows.map<ArchiveRecord>((row: ArchiveRecordRow) => ({
		...row,
		size: +(row.size ?? 0),
		imageRatio: +(row.imageRatio ?? 0),
	}));

	if (requestQuery.recordIds !== undefined) {
		// Our API contract remains that the order in which this endpoint returns
		// records is undefined. This ordering logic is implemented as a hotfix, and
		// should be removed when our clients no longer rely on this endpoint returning
		// records in a particular order.
		const recordsById = new Map<string, ArchiveRecord>();
		records.forEach((archiveRecord: ArchiveRecord) =>
			recordsById.set(archiveRecord.recordId, archiveRecord),
		);
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

export const patchRecord = async (
	recordId: string,
	recordData: PatchRecordRequest,
): Promise<string> => {
	await validateCanPatchRecord(recordId, recordData.emailFromAuthToken);

	const result = await db
		.sql<ArchiveRecordRow>("record.queries.update_record", {
			recordId,
			displayName: recordData.displayName,
			locationId: recordData.locationId,
			setLocationIdToNull: recordData.locationId === null,
			description: recordData.description,
			setDescriptionToNull: recordData.description === null,
			displayTimeInEDTF: recordData.displayTimeInEDTF,
			setDisplayTimeInEDTFToNull: recordData.displayTimeInEDTF === null,
		})
		.catch((err: unknown) => {
			logger.error(err);
			throw new createError.InternalServerError("Failed to update record");
		});

	if (result.rows[0] === undefined) {
		throw new createError.NotFound("Record not found");
	}
	return result.rows[0].recordId;
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
	);
	return shareLinks;
};
