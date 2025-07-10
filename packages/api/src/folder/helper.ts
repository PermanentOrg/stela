import type { PatchFolderRequest, FolderColumnsForUpdate } from "./models";

export const requestFieldsToDatabaseFields = (
	request: PatchFolderRequest,
	folderId: string,
): FolderColumnsForUpdate => ({
	displaydt: request.displayDate,
	displayenddt: request.displayEndDate,
	folderId,
});
