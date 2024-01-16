SELECT
  steward_account.fullName AS "stewardName",
  steward_account.primaryEmail AS "stewardEmail",
  owner_account.fullName AS "ownerName",
  profile_item.string1 AS "archiveName"
FROM
  directive
JOIN
  account AS steward_account
  ON steward_account.accountId = directive.steward_account_id
JOIN
  account_archive
  ON account_archive.archiveId = directive.archive_id
  AND account_archive.accessRole = 'access.role.owner'
  AND account_archive.status = 'status.generic.ok'
JOIN
  account AS owner_account
  ON owner_account.accountId = account_archive.accountId
JOIN
  profile_item
  ON profile_item.archiveId = directive.archive_id
  AND profile_item.fieldNameUI = 'profile.basic'
  AND profile_item.status != 'status.generic.deleted'
WHERE
  directive.directive_id = :directiveId
