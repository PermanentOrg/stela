import { type Access, AccessRole, AccessStatus, AccessType } from "./models";
import type {
  GetAccountArchiveResult,
  GetCurrentAccountArchiveResult,
} from "../account/models";

const checkCanEdit = (accessList: Access[]): boolean => {
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

const checkCanEditAccountArchive = (
  archive: GetAccountArchiveResult | GetCurrentAccountArchiveResult
): boolean => {
  let canEdit = false;
  if (
    [
      AccessRole.Admin.toString(),
      AccessRole.Curator.toString(),
      AccessRole.Editor.toString(),
      AccessRole.Owner.toString(),
      AccessRole.Manager.toString(),
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
