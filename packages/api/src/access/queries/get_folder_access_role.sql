WITH folder_share AS (
  SELECT
    folder_link.folderid,
    access.accessrole,
    access.archiveid
  FROM
    access
  INNER JOIN
    folder_link
    ON access.folder_linkid = folder_link.folder_linkid
  WHERE
    folder_link.folderid = :itemId
    AND access.status = 'status.generic.ok'
    AND folder_link.status = 'status.generic.ok'
)
SELECT
  account_archive.accessrole AS "archiveAccessRole",
  folder_share.accessrole AS "shareAccessRole"
FROM
  account_archive
INNER JOIN
  account
  ON account.accountid = account_archive.accountid
LEFT JOIN
  folder
  ON
    folder.archiveid = account_archive.archiveid
    AND folder.folderid = :itemId
LEFT JOIN
  folder_share
  ON
    folder_share.archiveid = account_archive.archiveid
WHERE
  (
    folder.folderid = :itemId
    OR folder_share.folderid = :itemId
  )
  AND account.primaryemail = :email
  AND account_archive.status = 'status.generic.ok'
  AND account.status = 'status.auth.ok'
  AND
  (
    folder.status != 'status.generic.deleted'
    OR folder.status IS NULL
  );
