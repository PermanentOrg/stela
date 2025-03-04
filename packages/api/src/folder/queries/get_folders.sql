WITH RECURSIVE folder_path AS (
  SELECT
    folder.folderid AS original_folder_id,
    folder.folderid,
    folder_link.parentfolderid,
    folder.displayname,
    1 AS height
  FROM folder
  INNER JOIN folder_link ON folder.folderid = folder_link.folderid
  WHERE folder.folderid = ANY(:folderIds)

  UNION ALL

  SELECT
    folder_path.original_folder_id AS original_folder_id,
    folder.folderid,
    folder_link.parentfolderid,
    folder.displayname,
    folder_path.height + 1 AS height
  FROM folder_path
  INNER JOIN folder_link ON folder_path.parentfolderid = folder_link.folderid
  INNER JOIN folder ON folder_link.folderid = folder.folderid
  WHERE folder_link.parentfolderid IS NOT NULL
),

aggregated_path AS (
  SELECT
    original_folder_id AS "folderid",
    ARRAY_AGG(displayname ORDER BY height DESC) AS name_path
  FROM folder_path
  GROUP BY
    original_folder_id
),

aggregated_shares AS (
  SELECT
    share.folder_linkid,
    ARRAY_AGG(JSONB_BUILD_OBJECT(
      'id',
      share.shareid::text,
      'accessRole',
      share.accessrole,
      'status',
      share.status,
      'archive',
      JSONB_BUILD_OBJECT(
        'id',
        archive.archiveid::text,
        'thumbUrl200',
        archive.thumburl200,
        'name',
        profile_item.string1
      )
    )) AS folder_shares
  FROM
    share
  INNER JOIN
    archive
    ON
      share.archiveid = archive.archiveid
  INNER JOIN
    profile_item
    ON
      archive.archiveid = profile_item.archiveid
      AND profile_item.fieldnameui = 'profile.basic'
      AND profile_item.string1 IS NOT NULL
  WHERE
    share.status = 'status.generic.ok'
  GROUP BY share.folder_linkid
),

aggregated_tags AS (
  SELECT
    tag_link.refid,
    ARRAY_AGG(JSON_BUILD_OBJECT(
      'id',
      tag.tagid::text,
      'name',
      tag.name,
      'type',
      tag.type
    )) AS "tags"
  FROM
    tag_link
  INNER JOIN
    tag
    ON
      tag_link.tagid = tag.tagid
  WHERE
    tag_link.reftable = 'folder'
    AND tag.status != 'status.generic.deleted'
    AND tag_link.status != 'status.generic.deleted'
  GROUP BY tag_link.refid
),

ancestor_unrestricted_share_tokens (
  parentfolder_linkid,
  folderid,
  urltoken
) AS (
  SELECT
    folder_link.parentfolder_linkid,
    folder_link.folderid,
    shareby_url.urltoken
  FROM folder_link
  LEFT JOIN shareby_url
    ON
      folder_link.folder_linkid = shareby_url.folder_linkid
      AND shareby_url.unrestricted
      AND (
        shareby_url.expiresdt IS NULL
        OR shareby_url.expiresdt > CURRENT_TIMESTAMP
      )
  WHERE
    folder_link.folderid = ANY(:folderIds)
  UNION
  SELECT
    folder_link.parentfolder_linkid,
    ancestor_unrestricted_share_tokens.folderid,
    shareby_url.urltoken
  FROM folder_link
  INNER JOIN
    ancestor_unrestricted_share_tokens
    ON
      folder_link.folder_linkid
      = ancestor_unrestricted_share_tokens.parentfolder_linkid
  LEFT JOIN shareby_url
    ON
      folder_link.folder_linkid = shareby_url.folder_linkid
      AND shareby_url.unrestricted
      AND (
        shareby_url.expiresdt IS NULL
        OR shareby_url.expiresdt > CURRENT_TIMESTAMP
      )
),

aggregated_ancestor_unrestricted_share_tokens AS (
  SELECT
    folderid,
    ARRAY_AGG(urltoken) FILTER (WHERE urltoken IS NOT NULL) AS "tokens"
  FROM
    ancestor_unrestricted_share_tokens
  GROUP BY folderid
),

account_by_archive AS (
  SELECT
    account.accountid,
    account.primaryemail,
    account_archive.archiveid
  FROM
    account
  INNER JOIN
    account_archive
    ON
      account.accountid = account_archive.accountid
      AND account_archive.status = 'status.generic.ok'
  WHERE
    account.primaryemail = :email
),

account_by_share AS (
  SELECT
    account.accountid,
    account.primaryemail,
    access.folder_linkid
  FROM
    account
  INNER JOIN
    account_archive
    ON
      account.accountid = account_archive.accountid
  INNER JOIN
    access
    ON
      account_archive.archiveid = access.archiveid
  WHERE
    account.primaryemail = :email
    AND access.status != 'status.generic.deleted'
    AND account_archive.status = 'status.generic.ok'
)

SELECT
  folder.folderid AS "folderId",
  folder_size.allfilesizedeep AS "size",
  aggregated_shares.folder_shares AS "shares",
  aggregated_tags.tags AS "tags",
  folder.createddt AS "createdAt",
  folder.updateddt AS "updatedAt",
  folder.description AS "description",
  folder.displaydt AS "displayTimestamp",
  folder.displayenddt AS "displayEndTimestamp",
  folder.displayname AS "displayName",
  folder.downloadname AS "downloadName",
  folder.imageratio AS "imageRatio",
  folder.publicdt AS "publicAt",
  folder.sort AS "sort",
  folder.type AS "type",
  folder.status AS "status",
  folder.view AS "view",
  folder_link.folder_linkid AS "folderLinkId",
  JSON_BUILD_OBJECT(
    'id',
    locn.locnid::text,
    'streetNumber',
    locn.streetnumber,
    'streetName',
    locn.streetname,
    'locality',
    locn.locality,
    'county',
    locn.admintwoname,
    'state',
    locn.adminonename,
    'latitude',
    locn.latitude,
    'longitude',
    locn.longitude,
    'country',
    locn.country,
    'countryCode',
    locn.countrycode,
    'displayName',
    locn.displayname
  ) AS "location",
  JSON_BUILD_OBJECT(
    'id',
    folder_link.parentfolderid::text
  ) AS "parentFolder",
  JSON_BUILD_OBJECT(
    'id',
    folder.archiveid::text
  ) AS "archive",
  JSONB_BUILD_OBJECT(
    'names',
    aggregated_path.name_path
  ) AS "paths",
  JSON_BUILD_OBJECT(
    '200',
    folder.thumburl200,
    '500',
    folder.thumburl500,
    '1000',
    folder.thumburl1000,
    '2000',
    folder.thumburl2000,
    '256',
    folder.thumbnail256
  ) AS "thumbnailUrls"
FROM
  folder
INNER JOIN
  folder_link
  ON
    folder.folderid = folder_link.folderid
    AND folder_link.status != 'status.generic.deleted'
LEFT JOIN
  folder_size
  ON
    folder.folderid = folder_size.folderid
    AND folder_size.status != 'status.generic.deleted'
INNER JOIN
  aggregated_path
  ON
    folder.folderid = aggregated_path.folderid
LEFT JOIN
  account_by_archive
  ON
    folder.archiveid = account_by_archive.archiveid
LEFT JOIN
  aggregated_shares
  ON
    folder_link.folder_linkid = aggregated_shares.folder_linkid
LEFT JOIN
  aggregated_tags
  ON
    folder.folderid = aggregated_tags.refid
LEFT JOIN
  locn
  ON
    folder.locnid = locn.locnid
LEFT JOIN
  account_by_share
  ON
    folder_link.folder_linkid = account_by_share.folder_linkid
LEFT JOIN
  aggregated_ancestor_unrestricted_share_tokens
  ON folder.folderid = aggregated_ancestor_unrestricted_share_tokens.folderid
WHERE
  folder.folderid = ANY(:folderIds)
  AND (
    (
      folder.publicdt IS NOT NULL
      AND folder.publicdt <= NOW()
    )
    OR (
      account_by_archive.primaryemail = :email
      AND account_by_archive.primaryemail IS NOT NULL
    )
    OR (
      :shareToken::text IS NOT NULL
      AND :shareToken = ANY(
        aggregated_ancestor_unrestricted_share_tokens.tokens
      )
    )
    OR (
      account_by_share.primaryemail = :email
      AND account_by_share.primaryemail IS NOT NULL
    )
  )
  AND folder.status != 'status.generic.deleted';
