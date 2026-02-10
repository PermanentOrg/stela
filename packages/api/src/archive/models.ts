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

export interface Archive {
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
	status: string;
	type: string;
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
