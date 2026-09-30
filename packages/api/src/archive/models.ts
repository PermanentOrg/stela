import { ArchiveMembershipRole } from "../access/models.js";
import type { Folder } from "../folder/models.js";
import type { Share } from "../share/models.js";
import type { ItemSummary } from "../item/models.js";
import type { TagSummary } from "../tag/models.js";

export { ArchiveMembershipRole };

export interface Tag {
	tagId: string;
	name: string;
	archiveId: string;
	status: string;
	type: string;
	createdDt: string;
	updatedDt: string;
}

export interface AccountStorage {
	accountSpaceId: string;
	accountId: string;
	spaceLeft: string;
	spaceTotal: string;
	filesLeft: string;
	filesTotal: string;
	status: string;
	type: string;
	createdDt: string;
	updatedDt: string;
}

export interface FeaturedArchive {
	archiveId: string;
	name: string;
	type: string;
	archiveNbr: string;
	profileImage: string;
	bannerImage: string;
}

export interface ThumbnailUrls {
	width200: string | null;
	width500: string | null;
	width1000: string | null;
	width2000: string | null;
}

export interface ArchiveOwner {
	name: string;
	email: string;
	phoneNumber?: string | null;
}

export enum MilestoneSortOrder {
	Chronological = "chronological",
	ReverseChronological = "reverse_chronological",
}

export enum ArchiveStatus {
	Ok = "ok",
	Orphaned = "orphaned",
	GenerateAvatar = "generate-avatar",
}

export enum ArchiveType {
	Person = "person",
	Group = "group",
	Organization = "organization",
	Nonprofit = "nonprofit",
}

export interface Archive {
	id: string;
	archiveId: string;
	rootFolderId: string;
	description?: string | null;
	name: string;
	payerAccountId?: string | null;
	public: boolean;
	publicAt?: string | null;
	allowPublicDownload: boolean;
	thumbnailUrls: ThumbnailUrls;
	owner?: ArchiveOwner | null;
	milestoneSortOrder: MilestoneSortOrder;
	callerMembershipRole?: ArchiveMembershipRole | null;
	status: ArchiveStatus;
	type: ArchiveType;
	createdAt: string;
	updatedAt: string;
}

export interface GetArchivesResponse {
	items: Archive[];
	pagination: {
		nextCursor: string | undefined;
		nextPage: string | undefined;
		totalPages: number;
	};
}

export interface GetSharedFoldersResponse {
	items: Folder[];
	pagination: {
		nextCursor: string | undefined;
		nextPage: string | undefined;
		totalPages: number;
	};
}

export interface ArchiveSummary {
	id: string;
	name: string;
	thumbnailUrls: {
		width200: string | null;
		width500: string | null;
		width1000: string | null;
		width2000: string | null;
	};
}

export interface GetReceivedSharesResponse {
	items: Share[];
	pagination: {
		nextCursor: string | undefined;
		nextPage: string | undefined;
		totalPages: number;
	};
}

export interface Milestone {
	id: string;
	title: string;
	description: string | null;
	date: string | null;
}

export interface ArchiveNameMatch {
	matchType: "archiveName";
	matchedWords: string[];
}

export interface MilestoneMatch {
	matchType: "milestone";
	matchedFields: Array<"title" | "description">;
	matchedWords: string[];
	milestone: Milestone;
}

export interface ItemMatch {
	matchType: "item";
	matchedFields: Array<"name" | "description" | "tagName" | "tagType">;
	matchedWords: string[];
	item: ItemSummary;
	matchedTags?: TagSummary[];
}

export type PublicArchiveSearchMatch =
	| ArchiveNameMatch
	| MilestoneMatch
	| ItemMatch;

export interface PublicArchiveSearchResult {
	archive: ArchiveSummary;
	totalMatchCount: number;
	matches: PublicArchiveSearchMatch[];
}

export interface SearchPublicArchivesResponse {
	items: PublicArchiveSearchResult[];
	pagination: {
		nextCursor: string | undefined;
		nextPage: string | undefined;
		totalPages: number;
	};
}
