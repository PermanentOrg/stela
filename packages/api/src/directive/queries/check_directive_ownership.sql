SELECT EXISTS(
  SELECT account_archive.account_archiveid
  FROM
    account_archive
  INNER JOIN
    account
    ON account_archive.accountid = account.accountid
  INNER JOIN
    directive
    ON account_archive.archiveid = directive.archive_id
  WHERE
    directive.directive_id = :directiveId
    AND account.primaryemail = :email
    AND account_archive.accessrole = 'access.role.owner'
    AND account_archive.status = 'status.generic.ok'
) AS "hasAccess";
