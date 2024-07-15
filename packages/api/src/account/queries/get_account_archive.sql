SELECT
  account_archive.accessrole as "accessRole",
  account_archive.accountid as "accountId"
FROM
  account_archive
INNER JOIN
  account
  ON account_archive.accountid = account.accountid
WHERE
  account_archive.archiveid = :archiveId
  AND account.primaryemail = :email
  AND account_archive.status = 'status.generic.ok'
;
