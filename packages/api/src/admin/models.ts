export interface Folder {
	folderId: string;
	archiveId: string;
}

export interface ArchiveRecord {
	recordId: string;
	parentFolderId: string;
	archiveId: string;
}

export interface OriginalFile {
	fileId: string;
	format: string;
	cloudPath: string | null;
	recordDownloadName: string | null;
}

export interface SkippedFile {
	fileId: string;
	reason: string;
}

export interface ModernizeOriginalFileCloudpathsResult {
	updatedFileIds: string[];
	skippedFiles: SkippedFile[];
	fileIdsWithErrors: string[];
	fileIdsWithUndeletedOldObjects: string[];
}
