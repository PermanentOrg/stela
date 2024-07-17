DELETE FROM account_archive
WHERE
  archiveid = :archiveId
  AND accountid IN (SELECT accountid FROM account WHERE primaryemail = :email)
RETURNING
account_archiveid AS "accountArchiveId";
