SELECT DISTINCT record.recordid AS "recordId"
FROM
  record
INNER JOIN
  account_archive AS record_account_archive
  ON record.archiveid = record_account_archive.archiveid
INNER JOIN
  account AS record_account
  ON record_account_archive.accountid = record_account.accountid
INNER JOIN
  folder_link
  ON record.recordid = folder_link.recordid
LEFT JOIN
  access
  ON folder_link.folder_linkid = access.folder_linkid
LEFT JOIN
  account_archive as share_account_archive
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
