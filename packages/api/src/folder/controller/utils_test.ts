import { db } from "../../database.js";
import { runFixtures } from "../../../test/run_fixtures.js";

export const loadFixtures = async (): Promise<void> => {
	await runFixtures(db, [
		"folder.fixtures.create_test_accounts",
		"folder.fixtures.create_test_archives",
		"folder.fixtures.create_test_account_archives",
		"folder.fixtures.create_test_locations",
		"folder.fixtures.create_test_folders",
		"folder.fixtures.create_test_records",
		"folder.fixtures.create_test_files",
		"folder.fixtures.create_test_record_files",
		"folder.fixtures.create_test_folder_links",
		"folder.fixtures.create_test_shareby_urls",
		"folder.fixtures.create_test_accesses",
		"folder.fixtures.create_test_folder_sizes",
		"folder.fixtures.create_test_shares",
		"folder.fixtures.create_test_profile_items",
		"folder.fixtures.create_test_tags",
		"folder.fixtures.create_test_tag_links",
		"folder.fixtures.create_test_invite_shares",
	]);
};

export const clearDatabase = async (): Promise<void> => {
	await db.query(
		`TRUNCATE 
      event,
      account_archive,
      account,
      archive,
      folder,
      folder_link,
      shareby_url,
      access,
      folder_size,
      locn,
      share,
      profile_item,
      tag,
      tag_link,
      record,
      file,
      record_file,
      invite,
      invite_share
    CASCADE`,
	);
};
