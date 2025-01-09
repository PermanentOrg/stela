export interface Folder {
  folderId: string;
  archiveNumber: string;
  archiveId: string;
  displayName: string;
  downloadName?: string;
  downloadNameOk?: boolean;
  displayDate?: string;
  displayEndDate?: string;
  timeZoneId?: bigint;
  note?: string;
  description?: string;
  special?: string;
  sort?: string;
  locationId?: bigint;
  view?: string;
  viewProperty?: string;
  thumbArchiveNumber?: string;
  imageRatio?: number;
  thumbStatus?: string;
  thumbUrl200?: string;
  thumbUrl500?: string;
  thumbUrl1000?: string;
  thumbUrl2000?: string;
  status: FolderStatus;
  type: FolderType;
  publicAt: string;
  createdAt: string;
  updatedAt?: string;
  thumbnail256?: string;
  thumbnail256CloudPath?: string;
}

export interface FolderLink {
  folderLinkId: string;
  folderId: string;
  recordId: string;
  parentFolderLinkId: string;
  parentFolderId: string;
  archiveId: string;
  position: bigint;
  linkCount: bigint;
  accessRole: string;
  status: string;
  type: string;
  sharedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface FolderColumnsForUpdate {
  folderId: string;
  displaydt: string;
  displayenddt: string;
}

export interface PatchFolderRequest {
  emailFromAuthToken: string;
  displayDate: string;
  displayEndDate: string;
}

export enum FolderStatus {
  Deleted = "status.generic.deleted",
  Error = "status.generic.error",
  ManualReview = "status.generic.manual_review",
  Ok = "status.generic.ok",
  Copying = "status.folder.copying",
  Moving = "status.folder.moving",
  New = "status.folder.new",
  ThumbnailGenerating = "status.folder.genthumb",
  ThumbnailBroken = "status.folder.broken_thumbnail",
  NoThumbnailCandidates = "status.folder.no_thumbnail_candidates",
  Nested = "status.folder.nested",
  Empty = "status.folder.empty",
}

export enum FolderType {
  App = "type.folder.app",
  Private = "type.folder.private",
  Public = "type.folder.public",
  Share = "type.folder.share",
  RootApp = "type.folder.root.app",
  RootPrivate = "type.folder.root.private",
  RootPublic = "type.folder.root.public",
  RootRoot = "type.folder.root.root",
}
