SELECT
  directive.directive_id AS "directiveId",
  directive.archive_id AS "archiveId",
  directive.type AS "directiveType",
  directive.note,
  archive.archivenbr AS "archiveSlug",
  account.primaryemail AS "stewardEmail"
FROM
  directive
INNER JOIN
  archive
  ON directive.archive_id = archive.archiveid
INNER JOIN
  account
  ON directive.steward_account_id = account.accountid
INNER JOIN
  account_archive
  ON directive.archive_id = account_archive.archiveid
INNER JOIN
  directive_trigger
  ON directive.directive_id = directive_trigger.directive_id
WHERE
  account_archive.accountid = :accountId
  AND account_archive.accessrole = 'access.role.owner'
  AND account_archive.status = 'status.generic.ok'
  AND directive_trigger.type = 'admin'
  AND directive.execution_dt IS NULL;
