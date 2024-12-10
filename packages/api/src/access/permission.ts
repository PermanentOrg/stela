import { type Access, AccessRole, AccessStatus, AccessType } from "./models";
import type { GetAccountArchiveResult } from "../account/models";

const checkCanEdit = async (accessList: Access[]): Promise<boolean> => {
  let canEdit = false;
  accessList.forEach((access) => {
    if (access.status === AccessStatus.Ok && access.type === AccessType.Share) {
      if (
        [
          AccessRole.Admin,
          AccessRole.Curator,
          AccessRole.Editor,
          AccessRole.Owner,
        ].includes(access.role)
      ) {
        canEdit = true;
      }
    }
  });
  return canEdit;
};

const checkCanEditAccountArchive = async (
  archive: GetAccountArchiveResult
): Promise<boolean> => {
  let canEdit = false;
  if (
    [
      AccessRole.Admin.toString(),
      AccessRole.Curator.toString(),
      AccessRole.Editor.toString(),
      AccessRole.Owner.toString(),
    ].includes(archive.accessRole)
  ) {
    canEdit = true;
  }
  return canEdit;
};

export const permission = {
  checkCanEdit,
  checkCanEditAccountArchive,
};
