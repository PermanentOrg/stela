export interface Access {
  accessId: string;
  folderLinkId: string;
  archiveId: string;
  role: AccessRole;
  status: AccessStatus;
  type: AccessType;
  createdAt: string;
  updatedAt: string;
}

export enum AccessRole {
  Admin = "access.role.admin",
  Contributor = "access.role.contributor",
  Curator = "access.role.curator",
  Owner = "access.role.owner",
  Viewer = "access.role.viewer",
  Editor = "access.role.editor",
  Manager = "access.role.manager",
}

export enum AccessStatus {
  Ok = "status.generic.ok",
  Pending = "status.generic.pending",
  Deleted = "status.generic.deleted",
}

export enum AccessType {
  Share = "type.access.share",
  Other = "type.access.other",
}
