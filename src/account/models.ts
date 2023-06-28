export interface UpdateTagsRequest {
  emailFromAuthToken: string;
  addTags?: string[];
  removeTags?: string[];
}

export interface SignupDetails {
  token: string;
}
