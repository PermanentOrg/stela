export interface NotificationRow {
  id: number;
  toAccountId: string;
  toArchiveId: string;
  fromAccountId: string;
  fromArchiveId: string;
  folderLinkId: string;
  message: string;
  redirectUrl: string;
  thumbnailArchiveNumber: string;
  timesSent: number;
  lastSentDate: string;
  email: string;
  status: NotificationStatus;
  type: NotificationType;
  createdAt: string;
  updatedAt: string;
}

export enum NotificationStatus {
  Emailed = "status.notification.emailed",
  Error = "status.notification.error",
  New = "status.notification.new",
  Read = "status.notification.read",
  Seen = "status.notification.seen",
}

export enum NotificationType {
  AccountCreate = "type.notification.account.create",
  FamilySearch = "type.notification.familysearch",
  PaAccessChange = "type.notification.pa_access_change",
  PaResponse = "type.notification.pa_response",
  PaResponseNonTransfer = "type.notification.pa_response_non_transfer",
  PaShare = "type.notification.pa_share",
  PaTransfer = "type.notification.pa_transfer",
  PaDirective = "type.notification.transfer_directive",
  RelationshipAccepted = "type.notification.relationship_accept",
  RelationshipRequest = "type.notification.relationship_request",
  ShareInvitationAcceptance = "type.notification.share.invitation.acceptance",
  Share = "type.notification.share",
  ShareLinkRequest = "type.notification.sharelink.request",
  Zip = "type.notification.zip",
}