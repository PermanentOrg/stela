import { getPublicTags } from "./get_public_tags.js";
import { getPayerAccountStorage } from "./get_payer_account_storage.js";
import { makeFeatured } from "./make_featured.js";
import { unfeature } from "./unfeature.js";
import { getFeatured } from "./get_featured.js";
import { getSharedFolders } from "./get_shared_folders.js";
import { backfillLedger } from "./backfill_ledger.js";
import { searchArchives } from "./search_archives.js";
import { updateArchive } from "./update_archive.js";

export const archiveService = {
	getPublicTags,
	getPayerAccountStorage,
	makeFeatured,
	unfeature,
	getFeatured,
	getSharedFolders,
	backfillLedger,
	searchArchives,
	updateArchive,
};
