import { type Access, AccessRole, AccessStatus, AccessType } from "./models";

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
export const permission = {
  checkCanEdit,
};
