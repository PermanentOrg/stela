SELECT
  account_space.account_spaceid AS "accountSpaceId",
  account_space.accountid AS "accountId",
  account_space.spaceleft AS "spaceLeft",
  account_space.spacetotal AS "spaceTotal",
  account_space.fileleft AS "filesLeft",
  account_space.filetotal AS "filesTotal",
  account_space.status,
  account_space.type,
  account_space.createddt AS "createdDt",
  account_space.updateddt AS "updatedDt"
FROM
  account_space
INNER JOIN
  archive
  ON account_space.accountid = archive.payeraccountid
INNER JOIN
  account_archive
  ON archive.archiveid = account_archive.archiveid
INNER JOIN
  account
  ON account_archive.accountid = account.accountid
WHERE
  archive.archiveid = :archiveId
  AND account.primaryemail = :accountEmail
  AND account_archive.status = 'status.generic.ok';
