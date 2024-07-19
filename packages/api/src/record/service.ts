import createError from "http-errors";
import { logger } from "@stela/logger";
import { db } from "../database";
import type { ArchiveRecord, ArchiveRecordRow } from "./models";

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
