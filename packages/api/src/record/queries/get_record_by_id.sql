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
  files.files,
  folder_link.folder_linkid AS "folderLinkId",
  folder_link.type AS "folderLinkType",
  folder_link.parentfolderid AS "parentFolderId",
  folder_link.parentfolder_linkid AS "parentFolderLinkId",
  parent_folder.archivenbr AS "parentFolderArchiveNumber",
  tags.tags,
  archive.archivenbr AS "archiveArchiveNumber",
  shares.shares
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
  (SELECT
    recordid,
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
        file.downloadurl
    )) AS files
  FROM
    record_file
  INNER JOIN
    file
    ON record_file.fileid = file.fileid
  WHERE
    file.status != 'status.generic.deleted'
  GROUP BY record_file.recordid) AS files
  ON record.recordid = files.recordid
LEFT JOIN
  (SELECT
    refid,
    array_agg(jsonb_build_object(
        'tagId',
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
  GROUP BY tag_link.refid) AS tags
  ON record.recordid = tags.refid
INNER JOIN
  folder_link
  ON
    record.recordid = folder_link.recordid
    AND folder_link.status != 'status.generic.deleted'
INNER JOIN
  folder AS parent_folder
  ON folder_link.parentfolderid = parent_folder.folderid
  AND parent_folder.status != 'status.generic.deleted'
LEFT JOIN
  access
  ON folder_link.folder_linkid = access.folder_linkid
  AND access.status = 'status.generic.ok'
LEFT JOIN
  account_archive AS share_account_archive
  ON access.archiveid = share_account_archive.archiveid
  AND share_account_archive.status = 'status.generic.ok'
LEFT JOIN
  account as share_account
  ON share_account_archive.accountid = share_account.accountid
LEFT JOIN
  (SELECT
    folder_linkid,
    array_agg(jsonb_build_object(
        'shareId',
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
          'archiveId',
          archive.archiveid::TEXT
        )
   )) as shares
   FROM share
   INNER JOIN archive
     ON share.archiveid = archive.archiveid
   INNER JOIN profile_item
     ON profile_item.archiveid = archive.archiveid
   WHERE
     profile_item.fieldnameui = 'profile.basic'
     AND profile_item.status = 'status.generic.ok'
     AND profile_item.string1 IS NOT NULL
     AND share.status != 'status.generic.deleted'
   GROUP BY folder_linkid) as shares
  ON shares.folder_linkid = folder_link.folder_linkid
WHERE
  record.recordid = ANY(:recordIds)
  AND (
    record_account.primaryemail = :accountEmail
    OR share_account.primaryemail = :accountEmail
    OR (record.publicdt IS NOT NULL AND record.publicdt <= NOW())
  )
  AND record.status != 'status.generic.deleted';
