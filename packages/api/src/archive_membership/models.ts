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
	emailFromAuthToken: string;
	userSubjectFromAuthToken: string;
	accessRole?: ArchiveMembershipRole | undefined;
	status?: "ok" | undefined;
	userAgent?: string | undefined;
	ip?: string | undefined;
}
