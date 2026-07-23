import { db } from "../../database.js";
import type { Directive } from "../model.js";
import { confirmArchiveOwnership } from "./utils.js";

export const getDirectivesByArchiveId = async (
	archiveId: string,
	emailFromAuthToken: string,
): Promise<Directive[]> => {
	await confirmArchiveOwnership(archiveId, emailFromAuthToken);
	const directiveRows = await db.sql<Directive>(
		"directive.queries.get_directives_by_archive",
		{ archiveId },
	);
	return directiveRows.rows;
};
