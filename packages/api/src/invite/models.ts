import type { AccessRole } from "../access/models.js";

export interface PendingInviteShare {
	inviteId: string;
	inviteShareId: string;
	folderLinkId: string | null;
	accessRole: AccessRole | null;
}
