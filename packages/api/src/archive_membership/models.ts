import type { ArchiveMembershipRole } from "../access/models.js";

export interface ArchiveMembership {
	id: string;
	accountId: string;
	archive: {
		id: string;
		name: string | null;
		thumbnailUrls: {
			width200: string | null;
			width500: string | null;
			width1000: string | null;
			width2000: string | null;
		};
	};
	accessRole: ArchiveMembershipRole;
	status: string;
}

export interface UpdateArchiveMembershipRequest {
	accessRole?: ArchiveMembershipRole | undefined;
	status?: "ok" | undefined;
}

export type DeleteArchiveMembershipRequest = Record<string, never>;

export interface ArchiveMembershipCaller {
	email: string;
	subject: string;
	ip?: string | undefined;
	userAgent?: string | undefined;
}
