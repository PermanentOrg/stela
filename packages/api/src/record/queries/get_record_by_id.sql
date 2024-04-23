SELECT DISTINCT
  recordid AS "recordId"
FROM
  record
INNER JOIN
  account_archive
  ON record.archiveid = account_archive.archiveid
INNER JOIN
  account
  ON account_archive.accountid = account.accountid
INNER JOIN
  folder_link
  ON record.recordid = folder_link.recordid
LEFT JOIN
  access
  ON folder_link.folder_linkid = access.folder_linkid
WHERE
  recordid = ANY(:recordIds)
  AND (
    account.primaryemail = :accountEmail
    OR (record.publicdt IS NOT NULL AND record.publicdt <= NOW())
  )
  AND record.status != 'status.generic.deleted';
