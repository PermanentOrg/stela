import { db } from "../../database";

export const loadFixtures = async (): Promise<void> => {
  await db.sql("folder.fixtures.create_test_accounts");
  await db.sql("folder.fixtures.create_test_archives");
  await db.sql("folder.fixtures.create_test_account_archives");
  await db.sql("folder.fixtures.create_test_folders");
  await db.sql("folder.fixtures.create_test_records");
  await db.sql("folder.fixtures.create_test_files");
  await db.sql("folder.fixtures.create_test_record_files");
  await db.sql("folder.fixtures.create_test_folder_links");
  await db.sql("folder.fixtures.create_test_shareby_urls");
  await db.sql("folder.fixtures.create_test_accesses");
  await db.sql("folder.fixtures.create_test_folder_sizes");
  await db.sql("folder.fixtures.create_test_locns");
  await db.sql("folder.fixtures.create_test_shares");
  await db.sql("folder.fixtures.create_test_profile_items");
  await db.sql("folder.fixtures.create_test_tags");
  await db.sql("folder.fixtures.create_test_tag_links");
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
      record_file
    CASCADE`
  );
};
