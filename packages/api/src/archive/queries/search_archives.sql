WITH all_archives AS (
  SELECT
    archive.archiveid AS "archiveId",
    archive.archivenbr AS "archiveNbr",
    basic_profile_item.string1 AS name,
    text_data.valuetext AS description,
    archive.public,
    archive.publicdt AS "publicAt",
    archive.allowpublicdownload AS "allowPublicDownload",
    JSONB_BUILD_OBJECT(
      'width200', archive.thumburl200,
      'width500', archive.thumburl500,
      'width1000', archive.thumburl1000,
      'width2000', archive.thumburl2000
    ) AS "thumbnailUrls",
    archive.milestonesortorder AS "milestoneSortOrder",
    archive.status,
    archive.type,
    archive.createddt AS "createdAt",
    archive.updateddt AS "updatedAt",
    root_folder.folderid AS "rootFolderId",
    CASE
      WHEN :isAdmin
        THEN
          JSONB_BUILD_OBJECT(
            'name', owner_account.fullname,
            'email', owner_account.primaryemail,
            'phoneNumber', owner_account.primaryphone
          )
      ELSE NULL
    END AS owner,
    archive.payeraccountid AS "payerAccountId",
    CASE
      WHEN :callerMembershipRoles::text[] != '{}'::text[]
        THEN user_access.accessrole
      ELSE NULL
    END AS "callerMembershipRole",
    ROW_NUMBER() OVER (
      ORDER BY
        TS_RANK(
          TO_TSVECTOR('english', basic_profile_item.string1),
          PLAINTO_TSQUERY('english', :searchQuery)
        ) DESC,
        basic_profile_item.string1
    ) AS rank
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
      AND basic_profile_item.status != 'status.generic.deleted'
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
    account_archive AS owner_account_archive
    ON
      archive.archiveid = owner_account_archive.archiveid
      AND owner_account_archive.accessrole = 'access.role.owner'
      AND owner_account_archive.status = 'status.generic.ok'
  LEFT JOIN
    account AS owner_account
    ON owner_account_archive.accountid = owner_account.accountid
  LEFT JOIN
    account AS user_access_account
    ON user_access_account.primaryemail = :userEmail
  LEFT JOIN
    account_archive AS user_access
    ON
      archive.archiveid = user_access.archiveid
      AND user_access_account.accountid = user_access.accountid
      AND user_access.status = 'status.generic.ok'
  WHERE
    archive.status != 'status.generic.deleted'
    AND (
      :searchQuery = ''
      OR PLAINTO_TSQUERY('english', :searchQuery)
      @@ TO_TSVECTOR('english', basic_profile_item.string1)
    )
    AND (
      :callerMembershipRoles::text[] = '{}'::text[]
      OR user_access.accessrole = ANY(:callerMembershipRoles::text[])
    )
    AND (
      (archive.public IS NOT NULL AND archive.public)
      OR (NOT :isAdmin AND EXISTS (
        SELECT 1
        FROM account_archive
        INNER JOIN account
          ON account_archive.accountid = account.accountid
        WHERE
          account_archive.archiveid = archive.archiveid
          AND account.primaryemail = :userEmail
          AND account_archive.status = 'status.generic.ok'
      ))
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
  SELECT CEILING(COUNT(*) / :pageSize::numeric)::int AS total_pages
  FROM all_archives
)

SELECT
  "archiveId",
  "archiveNbr",
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
  owner,
  "payerAccountId",
  "callerMembershipRole",
  (SELECT total_pages.total_pages FROM total_pages) AS "totalPages"
FROM all_archives
WHERE
  rank > COALESCE((SELECT cursor.rank FROM cursor), 0)
ORDER BY rank ASC
LIMIT :pageSize;
