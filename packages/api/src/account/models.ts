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

interface RawNotificationPreferences {
	textPreference?: NotificationTypePreference;
	emailPreference?: NotificationTypePreference;
	inAppPreference?: NotificationTypePreference;
}

export interface Account {
	id: string;
	primaryEmail: {
		address: string;
		verified: boolean;
	};
	primaryPhone?: {
		number: string;
		verified: boolean;
	};
	fullName: string | null;
	defaultArchiveId?: string;
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
}

export interface AccountRow {
	id: string;
	primaryEmailAddress: string;
	emailStatus: string | null;
	primaryPhoneNumber: string | null;
	phoneStatus: string | null;
	fullName: string | null;
	defaultArchiveId: string | null;
	addressLineOne: string | null;
	addressLineTwo: string | null;
	city: string | null;
	state: string | null;
	zip: string | null;
	country: string | null;
	hideChecklist: boolean;
	allowSftpDeletion: boolean;
	notificationPreferences: RawNotificationPreferences;
	status: AccountStatus;
	type: AccountType;
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

export enum AccountStatus {
	Ok = "status.auth.ok",
	Invited = "status.generic.invited",
}

export enum AccountType {
	Standard = "type.account.standard",
	Test = "type.account.test",
}

export enum PrettyAccountStatus {
	Ok = "ok",
	Invited = "invited",
}

export enum PrettyAccountType {
	Standard = "standard",
	Test = "test",
}
