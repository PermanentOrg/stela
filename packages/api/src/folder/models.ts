import type { Share } from "../share/models";
import type { Tag } from "../tag/models";
import type { ArchiveRecord } from "../record/models";
import type { Location } from "../common/models";

export interface GetFolderChildrenResponse {
	items: (ArchiveRecord | Folder)[];
	pagination: {
		nextCursor: string | undefined;
		nextPage: string | undefined;
		totalPages: number;
	};
}

export interface FolderRow {
	folderId: string;
	size: string | null;
	location?: Location;
	parentFolder?: {
		id: string;
	};
	shares?: Share[];
	tags?: Tag[];
	archive: {
		id: string;
		name: string;
	};
	createdAt: string;
	updatedAt: string;
	description?: string;
	displayTimestamp?: string;
	displayEndTimestamp?: string;
	displayName: string;
	downloadName?: string;
	imageRatio?: string;
	paths: {
		names: string[];
	};
	publicAt?: string;
	sort: FolderSortOrder;
	thumbnailUrls?: ThumbnailUrls;
	type: FolderType;
	status: FolderStatus;
	view: FolderView;
	folderLinkId: string;
	shareLink?: {
		creatorAccount: {
			id: string;
			name: string;
		};
	};
}

export interface ThumbnailUrls {
	"200": string;
	"256": string;
	"500": string;
	"1000": string;
	"2000": string;
}

export interface Folder {
	folderId: string;
	size: number | null;
	location?: Location;
	parentFolder?: {
		id: string;
	};
	shares?: Share[];
	tags?: Tag[];
	archive: {
		id: string;
		name: string;
	};
	createdAt: string;
	updatedAt: string;
	description?: string;
	displayTimestamp?: string;
	displayEndTimestamp?: string;
	displayName: string;
	downloadName?: string;
	imageRatio?: number;
	paths: {
		names: string[];
	};
	publicAt?: string;
	sort: PrettyFolderSortOrder;
	thumbnailUrls?: ThumbnailUrls;
	type: PrettyFolderType;
	status: PrettyFolderStatus;
	view: PrettyFolderView;
	folderLinkId: string;
	shareLink?: {
		creatorAccount: {
			id: string;
			name: string;
		};
	};
}

export interface FolderLink {
	folderLinkId: string;
	folderId: string;
	recordId: string;
	parentFolderLinkId: string;
	parentFolderId: string;
	archiveId: string;
	position: bigint;
	linkCount: bigint;
	accessRole: string;
	status: string;
	type: string;
	sharedAt: string;
	createdAt: string;
	updatedAt: string;
}

export interface FolderColumnsForUpdate {
	folderId: string;
	displaydt: string;
	displayenddt: string;
}

export interface PatchFolderRequest {
	emailFromAuthToken: string;
	displayDate: string;
	displayEndDate: string;
}

export enum FolderStatus {
	Ok = "status.generic.ok",
	Copying = "status.folder.copying",
	Moving = "status.folder.moving",
	Deleted = "status.generic.deleted",
}

export enum FolderType {
	App = "type.folder.app",
	Private = "type.folder.private",
	Public = "type.folder.public",
	Share = "type.folder.share",
	RootApp = "type.folder.root.app",
	RootPrivate = "type.folder.root.private",
	RootPublic = "type.folder.root.public",
	RootRoot = "type.folder.root.root",
	RootShare = "type.folder.share.root",
}

export enum FolderView {
	Slideshow = "folder.view.slideshow",
	Grid = "folder.view.grid",
	List = "folder.view.list",
	StorySimple = "folder.view.storysimple",
	StoryScroll = "folder.view.storyscroll",
	StorySlider = "folder.view.storyslider",
	Collage = "folder.view.collage",
	CollageDetail = "folder.view.collagedetail",
	Mosaic = "folder.view.mosaic",
	Map = "folder.view.map",
	Date = "folder.view.date",
	Timeline = "folder.view.timeline",
	Gliding = "folder.view.gliding",
	Table = "folder.view.table",
	Tile = "folder.view.tile",
}

export enum FolderSortOrder {
	AlphabeticalAscending = "sort.alphabetical_asc",
	AlphabeticalDescending = "sort.alphabetical_desc",
	DisplayDateAscending = "sort.display_date_asc",
	DisplayDateDescending = "sort.display_date_desc",
	TypeAscending = "sort.type_asc",
	TypeDescending = "sort.type_desc",
}

export enum PrettyFolderSortOrder {
	AlphabeticalAscending = "alphabetical-ascending",
	AlphabeticalDescending = "alphabetical-descending",
	DateAscending = "date-ascending",
	DateDescending = "date-descending",
	TypeAscending = "type-ascending",
	TypeDescending = "type-descending",
}

export enum PrettyFolderType {
	AppRoot = "app-root",
	App = "app",
	Deprecated = "deprecated",
	PrivateRoot = "private-root",
	Private = "private",
	PublicRoot = "public-root",
	Public = "public",
	Root = "root",
	ShareRoot = "share-root",
}

export enum PrettyFolderStatus {
	Copying = "copying",
	Deleted = "deleted",
	Moving = "moving",
	Ok = "ok",
}

export enum PrettyFolderView {
	Grid = "grid",
	List = "list",
	Timeline = "timeline",
	Deprecated = "deprecated",
}
