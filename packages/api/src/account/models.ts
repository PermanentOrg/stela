import type { ArchiveMembershipRole } from "../access/models.js";

interface NotificationTypePreference {
	apps?: { confirmations?: boolean };
	share?: {
		requests?: boolean;
		activities?: boolean;
		confirmations?: boolean;
	};
	account?: {
		confirmations?: boolean;
		recommendations?: boolean;
	};
	archive?: {
		requests?: boolean;
		confirmations?: boolean;
	};
	relationships?: {
		requests?: boolean;
		confirmations?: boolean;
	};
}

export interface ArchiveSummary {
	id: string;
	name: string | null;
	thumbnailUrls: {
		width200: string | null;
		width500: string | null;
		width1000: string | null;
		width2000: string | null;
	};
}

export interface ArchiveMembership {
	id: string;
	accountId: string;
	archive: ArchiveSummary;
	accessRole: ArchiveMembershipRole;
	status: "ok" | "pending";
}

export interface Account {
	id: string;
	primaryEmail: {
		address: string;
		verified: boolean;
	};
	primaryPhone: {
		number: string;
		verified: boolean;
	} | null;
	fullName: string | null;
	defaultArchiveId: string | null;
	address: {
		lineOne: string | null;
		lineTwo: string | null;
		city: string | null;
		state: string | null;
		zip: string | null;
		country: string | null;
	};
	settings: {
		hideChecklist: boolean;
		allowSftpDeletion: boolean;
		notificationsEnabled: {
			sms?: NotificationTypePreference | undefined;
			email?: NotificationTypePreference | undefined;
			inApp?: NotificationTypePreference | undefined;
		};
	};
	status: PrettyAccountStatus;
	type: PrettyAccountType;
	archiveMemberships: ArchiveMembership[];
	createdAt: string;
	updatedAt: string;
}

export interface AccountRow extends Account {
	totalPages: number;
}

export interface GetAccountsQuery {
	accountIds?: string | string[];
	accountEmails?: string | string[];
	pageSize: number;
	cursor: string | undefined;
}

export interface GetAccountsResponse {
	items: Account[];
	pagination: {
		nextCursor: string | undefined;
		nextPage: string | undefined;
		totalPages: number;
	};
}

export interface UpdateTagsRequest {
	emailFromAuthToken: string;
	addTags?: string[];
	removeTags?: string[];
}

export interface GetMarketingTagsResponse {
	items: string[];
}

export interface PostMarketingTagsRequest {
	emailFromAuthToken: string;
	userSubjectFromAuthToken: string;
	tags: string[];
}

export interface SignupDetails {
	token: string;
}

export interface GetAccountArchiveResult {
	accountArchiveId: string;
	accountId: string;
	accessRole: string;
	type: string;
	status: string;
}
export interface LeaveArchiveRequest {
	emailFromAuthToken: string;
	userSubjectFromAuthToken: string;
	archiveId: string;
	ip: string;
}

export interface CreateStorageAdjustmentRequest {
	emailFromAuthToken: string;
	accountEmail: string;
	storageAmount: number;
}

export interface StorageAdjustment {
	newStorageTotal: number;
	adjustmentAmount: number;
	createdAt: Date;
}

export enum PrettyAccountStatus {
	Ok = "ok",
	Invited = "invited",
}

export enum PrettyAccountType {
	Standard = "standard",
	Test = "test",
}
