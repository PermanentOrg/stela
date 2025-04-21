export interface Folder {
	folderId: string;
	archiveId: string;
}

export interface ArchiveRecord {
	recordId: string;
	parentFolderId: string;
	archiveId: string;
}
