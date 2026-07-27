SELECT
  account_archive.account_archiveid AS id,
  account_archive.accountid AS "accountId",
  CASE
    WHEN account_archive.accessrole = 'access.role.contributor'
      THEN 'contributor'
    WHEN account_archive.accessrole = 'access.role.curator' THEN 'curator'
    WHEN account_archive.accessrole = 'access.role.owner' THEN 'owner'
    WHEN account_archive.accessrole = 'access.role.viewer' THEN 'viewer'
    WHEN account_archive.accessrole = 'access.role.editor' THEN 'editor'
    WHEN account_archive.accessrole = 'access.role.manager' THEN 'manager'
  END AS "accessRole",
  CASE
    WHEN account_archive.status = 'status.generic.pending' THEN 'pending'
    WHEN account_archive.status = 'status.generic.ok' THEN 'ok'
  END AS status,
  JSONB_BUILD_OBJECT(
    'id', account_archive.archiveid::text,
    'name', profile_item.string1,
    'thumbnailUrls', JSONB_BUILD_OBJECT(
      'width200', archive.thumburl200,
      'width500', archive.thumburl500,
      'width1000', archive.thumburl1000,
      'width2000', archive.thumburl2000
    )
  ) AS archive
FROM
  account_archive
INNER JOIN
  account ON account_archive.accountid = account.accountid
INNER JOIN
  archive ON account_archive.archiveid = archive.archiveid
INNER JOIN
  profile_item
  ON
    archive.archiveid = profile_item.archiveid
    AND profile_item.fieldnameui = 'profile.basic'
    AND profile_item.status = 'status.generic.ok'
WHERE
  account_archive.account_archiveid = :id
  AND account_archive.status != 'status.generic.deleted';
