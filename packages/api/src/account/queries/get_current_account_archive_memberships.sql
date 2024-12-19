SELECT
  account_archive.account_archiveid AS "accountArchiveId",
  account_archive.accountid AS "accountId",
  account_archive.archiveid AS "archiveId",
  account_archive.accessrole AS "accessRole",
  account_archive.type,
  account_archive.status
FROM
  account_archive
INNER JOIN
  account
  ON account_archive.accountid = account.accountid
WHERE
  account.primaryemail = :email
  AND account_archive.status = 'status.generic.ok'
