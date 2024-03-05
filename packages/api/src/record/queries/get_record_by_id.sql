SELECT
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
  AND account.primaryemail = :accountEmail;
