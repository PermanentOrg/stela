SELECT
  account_space.account_spaceId "accountSpaceId",
  account_space.accountId "accountId",
  account_space.spaceLeft "spaceLeft",
  account_space.spaceTotal "spaceTotal",
  account_space.fileLeft "filesLeft",
  account_space.fileTotal "filesTotal",
  account_space.status,
  account_space.type,
  account_space.createdDt "createdDt",
  account_space.updatedDt "updatedDt"
FROM
  account_space
JOIN
  archive
  ON account_space.accountId = archive.payerAccountId
JOIN
  account_archive
  ON archive.archiveId = account_archive.archiveId
JOIN
  account
  ON account_archive.accountId = account.accountId
WHERE
  archive.archiveId = :archiveId
  AND account.primaryEmail = :accountEmail
  AND account_archive.status = 'status.generic.ok';
