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
  files.files
FROM
  record
INNER JOIN
  account_archive AS record_account_archive
  ON record.archiveid = record_account_archive.archiveid
INNER JOIN
  account AS record_account
  ON record_account_archive.accountid = record_account.accountid
INNER JOIN
  (SELECT
    recordid,
    array_agg(jsonb_build_object('fileId', file.fileid::TEXT, 'size', file.size)) AS files
  FROM
    record_file
  INNER JOIN
    file
    ON record_file.fileid = file.fileid
  GROUP BY record_file.recordid) AS files
  ON record.recordid = files.recordid
INNER JOIN
  folder_link
  ON record.recordid = folder_link.recordid
LEFT JOIN
  access
  ON folder_link.folder_linkid = access.folder_linkid
LEFT JOIN
  account_archive AS share_account_archive
  ON access.archiveid = share_account_archive.archiveid
LEFT JOIN
  account as share_account
  ON share_account_archive.accountid = share_account.accountid
WHERE
  record.recordid = ANY(:recordIds)
  AND (
    record_account.primaryemail = :accountEmail
    OR share_account.primaryemail = :accountEmail
    OR (record.publicdt IS NOT NULL AND record.publicdt <= NOW())
  )
  AND record.status != 'status.generic.deleted';
