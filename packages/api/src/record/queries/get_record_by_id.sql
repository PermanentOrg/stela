WITH RECURSIVE aggregated_files AS (
  (SELECT
    record_file.recordid,
    array_agg(jsonb_build_object(
      'fileId',
      file.fileid::TEXT,
      'size',
      file.size,
      'format',
      file.format,
      'type',
      file.type,
      'fileUrl',
      file.fileurl,
      'downloadUrl',
      file.downloadurl,
      'createdAt',
      file.createddt,
      'updatedAt',
      file.updateddt
    )) AS files
  FROM
    record_file
  INNER JOIN
    file
    ON record_file.fileid = file.fileid
  WHERE
    file.status != 'status.generic.deleted'
    AND record_file.recordid = any(:recordIds)
  GROUP BY record_file.recordid)
),

aggregated_tags AS (
  SELECT
    tag_link.refid,
    array_agg(jsonb_build_object(
      'id',
      tag.tagid::TEXT,
      'name',
      tag.name,
      'type',
      tag.type
    )) AS tags
  FROM
    tag_link
  INNER JOIN
    tag
    ON
      tag_link.tagid = tag.tagid
      AND tag.status = 'status.generic.ok'
  WHERE
    tag_link.reftable = 'record'
    AND tag_link.status = 'status.generic.ok'
    AND tag_link.refid = any(:recordIds)
  GROUP BY tag_link.refid
),

aggregated_shares AS (
  SELECT
    share.folder_linkid,
    array_agg(jsonb_build_object(
      'id',
      share.shareid::TEXT,
      'accessRole',
      share.accessrole,
      'status',
      share.status,
      'archive',
      jsonb_build_object(
        'thumbUrl200',
        archive.thumburl200,
        'name',
        profile_item.string1,
        'id',
        archive.archiveid::TEXT
      )
    )) AS shares_as_json
  FROM share
  INNER JOIN archive
    ON share.archiveid = archive.archiveid
  INNER JOIN profile_item
    ON archive.archiveid = profile_item.archiveid
  INNER JOIN folder_link
    ON share.folder_linkid = folder_link.folder_linkid
  WHERE
    profile_item.fieldnameui = 'profile.basic'
    AND profile_item.status = 'status.generic.ok'
    AND profile_item.string1 IS NOT NULL
    AND share.status != 'status.generic.deleted'
    AND folder_link.recordid = any(:recordIds)
  GROUP BY share.folder_linkid
),

ancestor_unrestricted_share_tokens (
  parentfolder_linkid,
  recordid,
  urltoken
) AS (
  SELECT
    folder_link.parentfolder_linkid,
    folder_link.recordid,
    shareby_url.urltoken
  FROM folder_link
  LEFT JOIN shareby_url
    ON
      folder_link.folder_linkid = shareby_url.folder_linkid
      AND shareby_url.unrestricted
      AND (
        shareby_url.expiresdt IS NULL
        OR shareby_url.expiresdt > current_timestamp
      )
  WHERE
    folder_link.recordid = any(:recordIds)
  UNION
  SELECT
    folder_link.parentfolder_linkid,
    ancestor_unrestricted_share_tokens.recordid,
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
        OR shareby_url.expiresdt > current_timestamp
      )
),

aggregated_ancestor_unrestricted_share_tokens AS (
  SELECT
    recordid,
    array_agg(urltoken) FILTER (WHERE urltoken IS NOT NULL) AS "tokens"
  FROM
    ancestor_unrestricted_share_tokens
  GROUP BY recordid
)

SELECT DISTINCT ON (record.recordid)
  record.recordid AS "recordId",
  record.displayname AS "displayName",
  record.archiveid AS "archiveId",
  record.archivenbr AS "archiveNumber",
  record.description,
  record.publicdt AS "publicAt",
  record.downloadname AS "downloadName",
  record.uploadfilename AS "uploadFileName",
  record.uploadaccountid AS "uploadAccountId",
  record.uploadpayeraccountid AS "uploadPayerAccountId",
  record.size,
  record.displaydt AS "displayDate",
  record.derivedcreateddt AS "fileCreatedAt",
  record.imageratio AS "imageRatio",
  record.thumburl200 AS "thumbUrl200",
  record.thumburl500 AS "thumbUrl500",
  record.thumburl1000 AS "thumbUrl1000",
  record.thumburl2000 AS "thumbUrl2000",
  record.status,
  record.type,
  record.createddt AS "createdAt",
  record.updateddt AS "updatedAt",
  record.alttext AS "altText",
  aggregated_files.files,
  folder_link.folder_linkid AS "folderLinkId",
  folder_link.type AS "folderLinkType",
  folder_link.parentfolderid AS "parentFolderId",
  folder_link.parentfolder_linkid AS "parentFolderLinkId",
  parent_folder.archivenbr AS "parentFolderArchiveNumber",
  aggregated_tags.tags,
  archive.archivenbr AS "archiveArchiveNumber",
  aggregated_shares.shares_as_json AS "shares",
  json_build_object(
    'id',
    locn.locnid::TEXT,
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
  ) AS "location"
FROM
  record
INNER JOIN
  archive
  ON
    record.archiveid = archive.archiveid
    AND archive.status != 'status.generic.deleted'
    AND archive.status IS NOT NULL
INNER JOIN
  account_archive AS record_account_archive
  ON
    record.archiveid = record_account_archive.archiveid
    AND record_account_archive.status = 'status.generic.ok'
INNER JOIN
  account AS record_account
  ON record_account_archive.accountid = record_account.accountid
INNER JOIN
  aggregated_files
  ON record.recordid = aggregated_files.recordid
LEFT JOIN
  aggregated_tags
  ON record.recordid = aggregated_tags.refid
LEFT JOIN
  locn
  ON record.locnid = locn.locnid
INNER JOIN
  folder_link
  ON
    record.recordid = folder_link.recordid
    AND folder_link.status != 'status.generic.deleted'
INNER JOIN
  folder AS parent_folder
  ON
    folder_link.parentfolderid = parent_folder.folderid
    AND parent_folder.status != 'status.generic.deleted'
LEFT JOIN
  access
  ON
    folder_link.folder_linkid = access.folder_linkid
    AND access.status = 'status.generic.ok'
LEFT JOIN
  account_archive AS share_account_archive
  ON
    access.archiveid = share_account_archive.archiveid
    AND share_account_archive.status = 'status.generic.ok'
LEFT JOIN
  account AS share_account
  ON share_account_archive.accountid = share_account.accountid
LEFT JOIN
  aggregated_shares
  ON folder_link.folder_linkid = aggregated_shares.folder_linkid
LEFT JOIN
  aggregated_ancestor_unrestricted_share_tokens
  ON record.recordid = aggregated_ancestor_unrestricted_share_tokens.recordid
WHERE
  record.recordid = any(:recordIds)
  AND (
    record_account.primaryemail = :accountEmail
    OR share_account.primaryemail = :accountEmail
    OR (record.publicdt IS NOT NULL AND record.publicdt <= now())
    OR (
      :shareToken::TEXT IS NOT NULL
      AND :shareToken = any(
        aggregated_ancestor_unrestricted_share_tokens.tokens
      )
    )
  )
  AND record.status != 'status.generic.deleted';
