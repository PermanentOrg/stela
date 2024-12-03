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
  console.log("records", records);
  console.log(requestQuery.recordIds);
  console.log(requestQuery.accountEmail);
  return records;
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

export const getRecordByFolderLinkId = async (requestQuery: {
  folderLinkId: number;
}): Promise<ArchiveRecordRow[]> => {
  const records = await db
    .sql<ArchiveRecordRow>("record.queries.get_records_by_folder_link_id", {
      folderLinkId: requestQuery.folderLinkId,
    })
    .catch((err) => {
      logger.error(err);
      throw new createError.InternalServerError("failed to retrieve records");
    });

  if (records.rows.length === 0) {
    return [];
  }
  return records.rows;
};

export const getRecordByParentFolderId = async (requestQuery: {
  folderId: number;
}): Promise<ArchiveRecordRow[]> => {
  const records = await db
    .sql<ArchiveRecordRow>("record.queries.get_records_by_parent_folder_id", {
      folderId: requestQuery.folderId,
    })
    .catch((err) => {
      logger.error(err);
      throw new createError.InternalServerError("failed to retrieve records");
    });

  if (records.rows.length === 0) {
    return [];
  }
  return records.rows;
};

export const getRecordArchiveNbr = async (requestQuery: {
  archiveNbr: string;
}): Promise<ArchiveRecordRow[]> => {
  const records = await db
    .sql<ArchiveRecordRow>("record.queries.get_records_by_archive_nbr", {
      archiveNbr: requestQuery.archiveNbr,
    })
    .catch((err) => {
      logger.error(err);
      throw new createError.InternalServerError("failed to retrieve records");
    });

  if (records.rows.length === 0) {
    return [];
  }
  return records.rows;
};
