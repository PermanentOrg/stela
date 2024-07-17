export interface UpdateTagsRequest {
  emailFromAuthToken: string;
  addTags?: string[];
  removeTags?: string[];
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
  archiveId: string;
  ip: string;
  userAgent?: string;
}
