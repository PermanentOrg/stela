SELECT account_archive.accessrole AS "accessRole"
FROM account_archive
INNER JOIN account
  ON account_archive.accountid = account.accountid
WHERE
  account.primaryemail = :email
  AND account_archive.archiveid = :archiveId
  AND account_archive.status = 'status.generic.ok'
  AND account.status = 'status.auth.ok';
