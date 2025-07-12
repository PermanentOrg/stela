import createError from "http-errors";
import { logger } from "@stela/logger";
import { db } from "../database";
import type {
	ArchiveRecord,
	ArchiveRecordRow,
	PatchRecordRequest,
	RecordColumnsForUpdate,
} from "./models";
import { requestFieldsToDatabaseFields } from "./helper";
import { getRecordAccessRole, accessRoleLessThan } from "../access/permission";
import { AccessRole } from "../access/models";
import { shareLinkService } from "../share_link/service";
import type { ShareLink } from "../share_link/models";

export const getRecordById = async (requestQuery: {
	recordIds: string[];
	accountEmail: string | undefined;
	shareToken?: string | undefined;
}): Promise<ArchiveRecord[]> => {
	const record = await db
		.sql<ArchiveRecordRow>("record.queries.get_record_by_id", {
			recordIds: requestQuery.recordIds,
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

const buildPatchQuery = (columnsForUpdate: RecordColumnsForUpdate): string => {
	const updates = Object.entries(columnsForUpdate)
		.filter(([key, value]) => value !== undefined && key !== "recordId")
		.map(([key, _]) => `${key} = :${key}`);

	if (updates.length === 0) {
		throw new createError.BadRequest("Request cannot be empty");
	}

	const query = `
    UPDATE record
    SET ${updates.join(", ")}
    WHERE recordid = :recordId
    RETURNING record.recordid AS "recordId"
  `;

	return query.trim();
};

export const patchRecord = async (
	recordId: string,
	recordData: PatchRecordRequest,
): Promise<string> => {
	await validateCanPatchRecord(recordId, recordData.emailFromAuthToken);
	const columnsForUpdate = requestFieldsToDatabaseFields(recordData, recordId);
	const query = buildPatchQuery(columnsForUpdate);

	const result = await db
		.query<ArchiveRecordRow>(query, columnsForUpdate)
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
