UPDATE account_archive
SET
  accessrole = COALESCE(:accessRole::text, accessrole),
  status = COALESCE(:status::text, status),
  updateddt = NOW()
WHERE
  account_archiveid = :id
  AND status != 'status.generic.deleted'
RETURNING account_archiveid AS id
