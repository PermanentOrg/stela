SELECT
  steward_account.fullname AS "stewardName",
  steward_account.primaryemail AS "stewardEmail",
  owner_account.fullname AS "ownerName",
  profile_item.string1 AS "archiveName"
FROM
  directive
INNER JOIN
  account AS steward_account
  ON directive.steward_account_id = steward_account.accountid
INNER JOIN
  account_archive
  ON
    directive.archive_id = account_archive.archiveid
    AND account_archive.accessrole = 'access.role.owner'
    AND account_archive.status = 'status.generic.ok'
INNER JOIN
  account AS owner_account
  ON account_archive.accountid = owner_account.accountid
INNER JOIN
  profile_item
  ON
    directive.archive_id = profile_item.archiveid
    AND profile_item.fieldnameui = 'profile.basic'
    AND profile_item.status != 'status.generic.deleted'
WHERE
  directive.directive_id = :directiveId
