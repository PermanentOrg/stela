import createError from "http-errors";
import type { Archive } from "../models.js";
import { getArchives } from "./get_archives.js";

export const getArchive = async (
	archiveId: string,
	accountEmail: string | undefined,
): Promise<Archive> => {
	const { items } = await getArchives({
		archiveIds: [archiveId],
		accountEmail,
		pageSize: 1,
		cursor: undefined,
	});

	const [archive] = items;
	if (archive === undefined) {
		throw new createError.NotFound("Archive not found");
	}
	return archive;
};
