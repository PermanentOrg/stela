WITH record_share AS (
  SELECT
    folder_link.recordid,
    access.accessrole,
    access.archiveid
  FROM
    access
  INNER JOIN
    folder_link
    ON access.folder_linkid = folder_link.folder_linkid
  WHERE
    folder_link.recordid = :itemId
    AND access.status = 'status.generic.ok'
    AND folder_link.status = 'status.generic.ok'
)
SELECT
  account_archive.accessrole AS "archiveAccessRole",
  record_share.accessrole AS "shareAccessRole"
FROM
  account_archive
INNER JOIN
  account
  ON account_archive.accountid = account.accountid
LEFT JOIN
  record
  ON
    account_archive.archiveid = record.archiveid
    AND record.recordid = :itemId
LEFT JOIN
  record_share
  ON account_archive.archiveid = record_share.archiveid
WHERE
  (
    record.recordid = :itemId
    OR record_share.recordid = :itemId
  )
  AND account.primaryemail = :email
  AND account_archive.status = 'status.generic.ok'
  AND account.status = 'status.auth.ok'
  AND
  (
    record.status != 'status.generic.deleted'
    OR record.status IS NULL
  );
