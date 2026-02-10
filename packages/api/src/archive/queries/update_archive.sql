WITH archive_access AS (
  SELECT account_archive.archiveid
  FROM account_archive
  INNER JOIN account ON account_archive.accountid = account.accountid
  WHERE
    account.primaryemail = :email
    AND account_archive.archiveid = :archiveId
    AND account_archive.accessrole IN (
      'access.role.owner',
      'access.role.manager'
    )
    AND account_archive.status = 'status.generic.ok'
),

updated_archive AS (
  UPDATE archive
  SET
    milestonesortorder = :milestoneSortOrder,
    updateddt = NOW()
  WHERE
    archiveid = :archiveId
    AND status != 'status.generic.deleted'
    AND EXISTS (
      SELECT 1
      FROM archive_access
      WHERE archiveid = :archiveId
    )
  RETURNING
    archiveid,
    milestonesortorder,
    updateddt
)

SELECT
  archive.archiveid AS "archiveId",
  archive.archivenbr AS "archiveNbr",
  basic_profile_item.string1 AS name,
  text_data.valuetext AS description,
  archive.public,
  archive.publicdt AS "publicAt",
  archive.allowpublicdownload AS "allowPublicDownload",
  updated_archive.milestonesortorder AS "milestoneSortOrder",
  archive.status,
  archive.type,
  archive.createddt AS "createdAt",
  updated_archive.updateddt AS "updatedAt",
  root_folder.folderid AS "rootFolderId",
  archive.payeraccountid AS "payerAccountId",
  JSONB_BUILD_OBJECT(
    'width200', archive.thumburl200,
    'width500', archive.thumburl500,
    'width1000', archive.thumburl1000,
    'width2000', archive.thumburl2000
  ) AS "thumbnailUrls"
FROM
  archive
INNER JOIN
  updated_archive
  ON
    archive.archiveid = updated_archive.archiveid
INNER JOIN
  profile_item AS basic_profile_item
  ON
    archive.archiveid = basic_profile_item.archiveid
    AND basic_profile_item.fieldnameui = 'profile.basic'
    AND basic_profile_item.status != 'status.generic.deleted'
LEFT JOIN
  profile_item AS description_profile_item
  ON
    archive.archiveid = description_profile_item.archiveid
    AND description_profile_item.fieldnameui = 'profile.description'
    AND basic_profile_item.status != 'status.generic.deleted'
LEFT JOIN
  text_data
  ON
    description_profile_item.text_dataid1 = text_data.text_dataid
INNER JOIN
  folder AS root_folder
  ON
    archive.archiveid = root_folder.archiveid
    AND root_folder.type = 'type.folder.root.root';
