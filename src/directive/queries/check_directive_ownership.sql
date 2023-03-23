SELECT EXISTS (
  SELECT
    account_archiveId
  FROM
    account_archive
  JOIN
    account
    ON account_archive.accountId = account.accountId
  JOIN
    directive
    ON account_archive.archiveId = directive.archive_id
  WHERE
    directive_id = :directiveId
    AND account.primaryEmail = :email
    AND account_archive.accessRole = 'access.role.owner'
    AND account_archive.status = 'status.generic.ok'
) "hasAccess";
