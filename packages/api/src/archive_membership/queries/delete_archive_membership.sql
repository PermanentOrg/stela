DELETE FROM account_archive
WHERE
  account_archiveid = :id
  AND status != 'status.generic.deleted'
RETURNING
  account_archiveid AS id,
  accountid AS "accountId",
  archiveid AS "archiveId",
  accessrole AS "accessRole",
  position,
  type,
  status,
  createddt AS "createdAt",
  updateddt AS "updatedAt"
