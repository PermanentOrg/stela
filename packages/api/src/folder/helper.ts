import type { PatchFolderRequest, FolderColumnsForUpdate } from "./models";

export function requestFieldsToDatabaseFields(
	request: PatchFolderRequest,
	folderId: string,
): FolderColumnsForUpdate {
	return {
		displaydt: request.displayDate,
		displayenddt: request.displayEndDate,
		folderId,
	};
}
