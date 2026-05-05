import type { AccessRole } from "../common/models";

export interface Share {
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
