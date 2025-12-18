import type { FileType } from "@stela/permanent_models";
import type { Share } from "../share/models";
import type { Tag } from "../tag/models";
import type { Location } from "../common/models";

export interface ArchiveRecord {
	recordId: string;
	archiveId: string;
	displayName: string;
	archiveNumber?: string;
	description?: string;
	publicAt?: string;
	downloadName?: string;
	uploadFileName: string;
	uploadAccountId: string;
	uploadPayerAccountId?: string;
	size?: number;
	displayDate?: string;
	fileCreatedAt?: string;
	imageRatio?: number;
	thumbUrl200?: string;
	thumbUrl500?: string;
	thumbUrl1000?: string;
	thumbUrl2000?: string;
	status: RecordStatus;
	type: RecordType;
	createdAt: string;
	updatedAt?: string;
	altText?: string;
	files: ArchiveFile[];
	folderLinkId: string;
	folderLinkType: FolderLinkType;
	parentFolderId: string;
	parentFolderLinkId: string;
	parentFolderArchiveNumber: string;
	tags: Tag[];
	archiveArchiveNumber: string;
	shares: Share[];
	location: Location;
	archive: {
		id: string;
		name?: string;
		archiveNumber: string;
	};
	shareLink?: {
		creatorAccount: {
			id: string;
			name: string;
		};
	};
}

export interface ArchiveRecordRow {
	recordId: string;
	archiveId: string;
	displayName: string;
	archiveNumber?: string;
	description?: string;
	publicAt?: string;
	downloadName?: string;
	uploadFileName: string;
	uploadAccountId: string;
	uploadPayerAccountId?: string;
	size?: string;
	displayDate?: string;
	fileCreatedAt?: string;
	imageRatio?: string;
	thumbUrl200?: string;
	thumbUrl500?: string;
	thumbUrl1000?: string;
	thumbUrl2000?: string;
	status: RecordStatus;
	type: RecordType;
	createdAt: string;
	updatedAt?: string;
	altText?: string;
	files: ArchiveFile[];
	folderLinkId: string;
	folderLinkType: FolderLinkType;
	parentFolderId: string;
	parentFolderLinkId: string;
	parentFolderArchiveNumber: string;
	tags: Tag[];
	archiveArchiveNumber: string;
	shares: Share[];
	location: Location;
	archive: {
		id: string;
		name?: string;
		archiveNumber: string;
	};
	shareLink?: {
		creatorAccount: {
			id: string;
			name: string;
		};
	};
}

export interface ArchiveFile {
	fileId: string;
	size: number;
	format: FileFormat;
	type: FileType;
	fileUrl: string;
	downloadUrl: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface RecordColumnsForUpdate {
	recordId: string;
	locnid: bigint | undefined;
	description: string | undefined;
	displayname: string | undefined;
}

export interface PatchRecordRequest {
	emailFromAuthToken: string;
	locationId?: bigint;
	description?: string;
	displayName?: string;
}

export enum RecordStatus {
	Deleted = "status.generic.deleted",
	Error = "status.generic.error",
	ManualReview = "status.generic.manual_review",
	Ok = "status.generic.ok",
	Converting = "status.record.converting",
	NeedsConverting = "status.record.needs_converting",
	NeedsProcessing = "status.record.needs_processing",
	OnlyMeta = "status.record.only_meta",
	Processing = "status.record.processing",
	Reprocessing = "status.record.reprocessing",
	Uploaded = "status.record.uploaded",
}

export enum RecordType {
	Unknown = "type.record.unknown",
	Document = "type.record.document",
	Spreadsheet = "type.record.spreadsheet",
	Presentation = "type.record.presentation",
	Image = "type.record.image",
	GenealogyArchive = "Genealogy Archive",
	Archive = "type.record.archive",
	WebArchive = "type.record.web_archive",
	Video = "type.record.video",
	Audio = "type.record.audio",
	Genealogy = "Genealogy",
	Pdf = "type.record.pdf",
}

export enum FileFormat {
	Original = "file.format.original",
	Converted = "file.format.converted",
}

enum FolderLinkType {
	FolderLinkPrivate = "type.folder_link.private",
	FolderPrivate = "type.folder.private",
	FolderRootApp = "type.folder.root.app",
	FolderLinkPublic = "type.folder_link.public",
	FolderLinkVault = "type.folder_link.vault",
	FolderLinkApp = "type.folder_link.app",
	FolderLinkShare = "type.folder_link.share",
	FolderLinkRootRoot = "type.folder_link.root.root",
	FolderLinkRootVault = "type.folder_link.root.vault",
	FolderLinkRootApp = "type.folder_link.root.app",
	FolderLinkRootShare = "type.folder_link.root.share",
	FolderLinkRootPrivate = "type.folder_link.root.private",
}
