SELECT EXISTS(
  SELECT account_archive.account_archiveid
  FROM
    account_archive
  INNER JOIN
    account
    ON account_archive.accountid = account.accountid
  WHERE
    account_archive.archiveid = :archiveId
    AND account.primaryemail = :email
    AND account_archive.accessrole = 'access.role.owner'
    AND account_archive.status = 'status.generic.ok'
) AS "hasAccess";
