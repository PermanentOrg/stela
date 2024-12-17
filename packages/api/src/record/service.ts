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
import { permission } from "../access/permission";
import { accountService } from "../account/service";
import { recordAccess } from "./access";

export const getRecordById = async (requestQuery: {
  recordIds: string[];
  accountEmail: string;
}): Promise<ArchiveRecord[]> => {
  const record = await db
    .sql<ArchiveRecordRow>("record.queries.get_record_by_id", {
      recordIds: requestQuery.recordIds,
      accountEmail: requestQuery.accountEmail,
    })
    .catch((err) => {
      logger.error(err);
      throw new createError.InternalServerError(
        "failed to retrieve featured archives"
      );
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
  emailFromAuthToken: string
): Promise<void> => {
  const [record] = await getRecordById({
    recordIds: [recordId],
    accountEmail: emailFromAuthToken,
  });
  if (!record) {
    throw new createError.NotFound("Record not found.");
  }
  let canEdit = false;
  let canView = false;
  const accountArchive = await accountService.getAccountArchive(
    record.archiveId,
    emailFromAuthToken
  );
  if (accountArchive) {
    if (permission.checkCanEditAccountArchive(accountArchive)) {
      canEdit = true;
    }
    if (permission.checkCanViewAccountArchive(accountArchive)) {
      canView = true;
    }
  }
  if (!canEdit) {
    const archiveMemberships =
      await accountService.getCurrentAccountArchiveMemberships(
        emailFromAuthToken
      );
    await Promise.all(
      archiveMemberships.map(async (archiveMembership) => {
        if (permission.checkCanEditAccountArchive(archiveMembership)) {
          const accessList = await recordAccess.getAccessByRecord(
            record.recordId,
            archiveMembership.archiveId
          );
          if (permission.checkCanEdit(accessList)) {
            canEdit = true;
          }
          if (permission.checkCanView(accessList)) {
            canView = true;
          }
        }
        return archiveMembership;
      })
    );
  }
  if (!canView) {
    throw new createError.NotFound("Record not found.");
  }
  if (!canEdit) {
    throw new createError.Forbidden(
      "User does not have permission to modify record."
    );
  }
};

function buildPatchQuery(columnsForUpdate: RecordColumnsForUpdate): string {
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
}

export const patchRecord = async (
  recordId: string,
  recordData: PatchRecordRequest
): Promise<string> => {
  await validateCanPatchRecord(recordId, recordData.emailFromAuthToken);
  const columnsForUpdate = requestFieldsToDatabaseFields(recordData, recordId);
  const query = buildPatchQuery(columnsForUpdate);

  const result = await db
    .query<ArchiveRecordRow>(query, columnsForUpdate)
    .catch((err) => {
      logger.error(err);
      throw new createError.InternalServerError("Failed to update record");
    });

  if (result.rows[0] === undefined) {
    throw new createError.NotFound("Record not found");
  }
  return result.rows[0].recordId;
};
