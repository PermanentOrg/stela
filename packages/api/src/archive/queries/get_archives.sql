WITH all_archives AS (
  SELECT
    archive.archiveid AS id,
    archive.archiveid AS "archiveId",
    basic_profile_item.string1 AS name,
    text_data.valuetext AS description,
    archive.public,
    archive.publicdt AS "publicAt",
    archive.allowpublicdownload AS "allowPublicDownload",
    archive.milestonesortorder AS "milestoneSortOrder",
    archive.createddt AS "createdAt",
    archive.updateddt AS "updatedAt",
    root_folder.folderid AS "rootFolderId",
    archive.payeraccountid AS "payerAccountId",
    user_access.accessrole AS "callerMembershipRole",
    CASE
      WHEN archive.status = 'status.generic.orphaned' THEN 'orphaned'
      WHEN archive.status = 'status.archive.gen_avatar' THEN 'generate-avatar'
      WHEN archive.status IN ('status.generic.ok', 'status.auth.ok') THEN 'ok'
    END AS status,
    CASE
      WHEN archive.type = 'type.archive.person' THEN 'person'
      WHEN archive.type = 'type.archive.family' THEN 'group'
      WHEN archive.type = 'type.archive.organization' THEN 'organization'
      WHEN archive.type = 'type.archive.nonprofit' THEN 'nonprofit'
    END AS type,
    JSONB_BUILD_OBJECT(
      'width200', archive.thumburl200,
      'width500', archive.thumburl500,
      'width1000', archive.thumburl1000,
      'width2000', archive.thumburl2000
    ) AS "thumbnailUrls",
    ROW_NUMBER() OVER (ORDER BY archive.archiveid ASC) AS rank
  FROM
    archive
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
      AND description_profile_item.status != 'status.generic.deleted'
  LEFT JOIN
    text_data
    ON
      description_profile_item.text_dataid1 = text_data.text_dataid
  INNER JOIN
    folder AS root_folder
    ON
      archive.archiveid = root_folder.archiveid
      AND root_folder.type = 'type.folder.root.root'
  LEFT JOIN
    account AS user_access_account
    ON user_access_account.primaryemail = :accountEmail
  LEFT JOIN
    account_archive AS user_access
    ON
      archive.archiveid = user_access.archiveid
      AND user_access_account.accountid = user_access.accountid
      AND user_access.status = 'status.generic.ok'
  WHERE
    archive.status != 'status.generic.deleted'
    AND (
      :archiveIds::BIGINT[] IS NULL
      OR archive.archiveid = ANY(:archiveIds::BIGINT[])
    )
    AND (
      (archive.public IS NOT NULL AND archive.public)
      OR EXISTS (
        SELECT 1
        FROM account_archive
        INNER JOIN account
          ON account_archive.accountid = account.accountid
        WHERE
          account_archive.archiveid = archive.archiveid
          AND account.primaryemail = :accountEmail
          AND account_archive.status = 'status.generic.ok'
      )
    )
),

cursor AS (
  SELECT rank
  FROM
    all_archives
  WHERE
    "archiveId" = :cursor
),

total_pages AS (
  SELECT CEILING(COUNT(*) / :pageSize::NUMERIC)::INT AS total_pages
  FROM all_archives
)

SELECT
  id,
  "archiveId",
  name,
  description,
  public,
  "publicAt",
  "allowPublicDownload",
  "thumbnailUrls",
  "milestoneSortOrder",
  status,
  type,
  "createdAt",
  "updatedAt",
  "rootFolderId",
  "payerAccountId",
  "callerMembershipRole",
  (SELECT total_pages.total_pages FROM total_pages) AS "totalPages"
FROM all_archives
WHERE
  rank > COALESCE((SELECT cursor.rank FROM cursor), 0)
ORDER BY rank ASC
LIMIT :pageSize;
