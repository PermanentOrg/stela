SELECT EXISTS (
  SELECT
    account_archiveId
  FROM
    account_archive
  JOIN
    account
    ON account_archive.accountId = account.accountId
  WHERE
    archiveId = :archiveId
    AND account.primaryEmail = :email
    AND account_archive.accessRole = 'access.role.owner'
) "hasAccess";
