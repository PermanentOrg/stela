import type { AccessRole, ShareAccessRole } from "../access/models.js";
import type { ItemSummary } from "../item/models.js";
import type { ArchiveSummary } from "../archive/models.js";

export interface Share {
	id: string;
	item: ItemSummary;
	accessRole: ShareAccessRole;
	archive: ArchiveSummary;
	status: PrettyShareStatus;
	createdAt: string;
	updatedAt: string;
}

export interface ShareSummary {
	id: string;
	accessRole: AccessRole;
	status: ShareStatus;
	archive: ShareArchive;
}

export interface ShareArchive {
	id: string;
	thumbUrl200?: string;
	name: string;
}

export interface PendingShare {
	id: string;
	email: string;
	name: string | null;
	accessRole: AccessRole;
}

export enum ShareStatus {
	Ok = "status.generic.ok",
	Pending = "status.generic.pending",
	Deleted = "status.generic.deleted",
}

export enum PrettyShareStatus {
	Ok = "ok",
	Pending = "pending",
}
