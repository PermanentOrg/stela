import { db } from "../../database";
import type { Directive } from "../model";
import { confirmArchiveOwnership } from "./utils";

export const getDirectivesByArchiveId = async (
  archiveId: number,
  emailFromAuthToken: string
): Promise<Directive[]> => {
  await confirmArchiveOwnership(archiveId, emailFromAuthToken);
  const directiveRows = await db.sql<Directive>(
    "directive.queries.get_directives_by_archive",
    { archiveId }
  );
  return directiveRows.rows;
};
