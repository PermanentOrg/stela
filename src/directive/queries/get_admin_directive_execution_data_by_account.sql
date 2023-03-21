SELECT
  directive.directive_id "directiveId",
  directive.archive_id "archiveId",
  directive.type "directiveType",
  archive.archiveNbr "archiveSlug",
  account.primaryEmail "stewardEmail"
FROM
  directive
JOIN
  archive
  ON archive.archiveId = directive.archive_id
JOIN
  account
  ON account.accountId = directive.steward_account_id
JOIN
  account_archive
  ON directive.archive_id = account_archive.archiveId
JOIN
  directive_trigger
  ON directive.directive_id = directive_trigger.directive_id
WHERE
  account_archive.accountId = :accountId
  AND account_archive.accessRole = 'access.role.owner'
  AND account_archive.status = 'status.generic.ok'
  AND directive_trigger.type = 'admin'
  AND directive.execution_dt IS NULL;
