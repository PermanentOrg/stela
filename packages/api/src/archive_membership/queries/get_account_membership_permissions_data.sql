SELECT
  account_archive.archiveid AS "archiveId",
  account.primaryemail AS "accountEmail",
  account_archive.accessrole = 'access.role.owner' AS "isOwner"
FROM
  account_archive
INNER JOIN
  account
  ON
    account_archive.accountid = account.accountid
WHERE
  account_archive.account_archiveid = :id
  AND account_archive.status != 'status.generic.deleted';
