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
WHERE
  recordid = ANY(:recordIds)
  AND (
    account.primaryemail = :accountEmail
    OR (record.publicdt IS NOT NULL AND record.publicdt <= NOW())
  )
  AND record.status != 'status.generic.deleted';
