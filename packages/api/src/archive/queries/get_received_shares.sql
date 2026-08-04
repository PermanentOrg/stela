WITH archive_access AS (
  SELECT account_archive.archiveid
  FROM account_archive
  INNER JOIN account ON account_archive.accountid = account.accountid
  WHERE
    account.primaryemail = :email
    AND account_archive.archiveid = :archiveId
    AND account_archive.status = 'status.generic.ok'
    AND account.status = 'status.auth.ok'
),

all_received_shares AS (
  SELECT
    share.shareid::TEXT AS id,
    share.createddt AS "createdAt",
    share.updateddt AS "updatedAt",
    SUBSTRING(
      share.accessrole FROM (LENGTH('access.role.') + 1)
    ) AS "accessRole",
    CASE
      WHEN share.status = 'status.generic.ok' THEN 'ok'
      WHEN share.status = 'status.generic.pending' THEN 'pending'
    END AS status,
    JSONB_BUILD_OBJECT(
      'id', COALESCE(folder_link.recordid, folder_link.folderid)::TEXT,
      'itemType', CASE
        WHEN folder_link.recordid IS NOT NULL THEN 'record'
        ELSE 'folder'
      END,
      'displayName', COALESCE(item_record.displayname, item_folder.displayname),
      'displayTime', COALESCE(item_record.displaytime, item_folder.displaytime),
      'thumbnailUrls', JSONB_BUILD_OBJECT(
        'width200', COALESCE(item_record.thumburl200, item_folder.thumburl200),
        'width256',
        COALESCE(item_record.thumbnail256, item_folder.thumbnail256),
        'width500', COALESCE(item_record.thumburl500, item_folder.thumburl500),
        'width1000',
        COALESCE(item_record.thumburl1000, item_folder.thumburl1000),
        'width2000',
        COALESCE(item_record.thumburl2000, item_folder.thumburl2000)
      )
    ) AS item,
    JSONB_BUILD_OBJECT(
      'id', owner_archive.archiveid::TEXT,
      'name', basic_profile_item.string1,
      'thumbnailUrls', JSONB_BUILD_OBJECT(
        'width200', owner_archive.thumburl200,
        'width500', owner_archive.thumburl500,
        'width1000', owner_archive.thumburl1000,
        'width2000', owner_archive.thumburl2000
      )
    ) AS archive,
    ROW_NUMBER() OVER (ORDER BY share.shareid::BIGINT ASC) AS rank
  FROM share
  INNER JOIN archive_access ON share.archiveid = archive_access.archiveid
  INNER JOIN folder_link ON share.folder_linkid = folder_link.folder_linkid
  LEFT JOIN folder AS item_folder
    ON
      folder_link.folderid = item_folder.folderid
      AND item_folder.status != 'status.generic.deleted'
  LEFT JOIN record AS item_record
    ON
      folder_link.recordid = item_record.recordid
      AND item_record.status != 'status.generic.deleted'
  INNER JOIN archive AS owner_archive
    ON folder_link.archiveid = owner_archive.archiveid
  INNER JOIN profile_item AS basic_profile_item
    ON
      owner_archive.archiveid = basic_profile_item.archiveid
      AND basic_profile_item.fieldnameui = 'profile.basic'
      AND basic_profile_item.status != 'status.generic.deleted'
  WHERE
    share.status = 'status.generic.ok'
    AND folder_link.status = 'status.generic.ok'
),

cursor AS (
  SELECT rank
  FROM all_received_shares
  WHERE id = :cursor
),

total_pages AS (
  SELECT CEILING(COUNT(*)::FLOAT / :pageSize) AS total_pages
  FROM all_received_shares
)

SELECT
  id,
  status,
  "createdAt",
  "updatedAt",
  "accessRole",
  item,
  archive,
  (SELECT total_pages.total_pages FROM total_pages) AS "totalPages"
FROM all_received_shares
WHERE rank > COALESCE((SELECT cursor.rank FROM cursor), 0)
ORDER BY rank ASC
LIMIT :pageSize;
