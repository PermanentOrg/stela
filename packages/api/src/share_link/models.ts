export interface CreateShareLinkRequest {
	emailFromAuthToken: string;
	itemId: string;
	itemType: "folder" | "record";
	permissionsLevel?: "contributor" | "editor" | "manager" | "owner" | "viewer";
	accessRestrictions?: "account" | "approval" | "none";
	maxUses?: number;
	expirationTimestamp?: string;
}

export interface CreateShareLinkDatabaseParams {
	itemId: string;
	itemType: "folder" | "record";
	permissionsLevel:
		| "access.role.contributor"
		| "access.role.editor"
		| "access.role.manager"
		| "access.role.owner"
		| "access.role.viewer";
	unlisted: boolean;
	noApproval: number;
	maxUses: number;
	expirationTimestamp: string | undefined;
	urlToken: string;
	shareUrl: string;
	email: string;
}

export interface UpdateShareLinkRequest {
	emailFromAuthToken: string;
	permissionsLevel?: "contributor" | "editor" | "manager" | "owner" | "viewer";
	accessRestrictions?: "account" | "approval" | "none";
	maxUses?: number | null;
	expirationTimestamp?: string | null;
}

export interface UpdateShareLinkDatabaseParams {
	permissionsLevel:
		| "access.role.contributor"
		| "access.role.editor"
		| "access.role.manager"
		| "access.role.owner"
		| "access.role.viewer"
		| null;
	unlisted: boolean | null;
	noApproval: number | null;
	maxUses: number | null | undefined;
	setMaxUsesToNull: boolean;
	expirationTimestamp: string | null | undefined;
	setExpirationTimestampToNull: boolean;
	shareLinkId: string;
	email: string;
}

export interface ShareLink {
	id: string;
	itemId: string;
	itemType: "folder" | "record";
	token: string;
	permissionsLevel: "contributor" | "editor" | "manager" | "owner" | "viewer";
	accessRestrictions: "account" | "approval" | "none";
	maxUses: number | null;
	usesExpended: number | null;
	expirationTimestamp?: Date;
	creatorAccount: {
		id: string;
		name: string;
	};
	createdAt: Date;
	updatedAt: Date;
}

export interface ShareLinkRow {
	id: string;
	itemId: string;
	itemType: "folder" | "record";
	token: string;
	permissionsLevel: "contributor" | "editor" | "manager" | "owner" | "viewer";
	accessRestrictions: "account" | "approval" | "none";
	maxUses: string | null;
	usesExpended: string | null;
	expirationTimestamp?: Date;
	creatorAccount: {
		id: string;
		name: string;
	};
	createdAt: Date;
	updatedAt: Date;
}
