export interface UpdateTagsRequest {
  emailFromAuthToken: string;
  addTags?: string[];
  removeTags?: string[];
}
