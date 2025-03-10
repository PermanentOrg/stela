WITH archive_access AS (
  SELECT account_archive.archiveid
  FROM account_archive
  INNER JOIN account ON account_archive.accountid = account.accountid
  WHERE
    account.primaryemail = :email
    AND account_archive.archiveid = :archiveId
    AND account_archive.status = 'status.generic.ok'
)

SELECT folder_link.folderid AS "folderId"
FROM folder_link
INNER JOIN share ON folder_link.folder_linkid = share.folder_linkid
INNER JOIN archive_access ON folder_link.archiveid = archive_access.archiveid
WHERE share.status = 'status.generic.ok';
