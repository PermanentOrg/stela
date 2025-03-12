import { getPublicTags } from "./get_public_tags";
import { getPayerAccountStorage } from "./get_payer_account_storage";
import { makeFeatured } from "./make_featured";
import { unfeature } from "./unfeature";
import { getFeatured } from "./get_featured";
import { getSharedFolders } from "./get_shared_folders";

export const archiveService = {
  getPublicTags,
  getPayerAccountStorage,
  makeFeatured,
  unfeature,
  getFeatured,
  getSharedFolders,
};
