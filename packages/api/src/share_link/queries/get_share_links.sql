SELECT
  shareby_url.shareby_urlid AS id,
  shareby_url.urltoken AS token,
  shareby_url.uses AS "usesExpended",
  shareby_url.expiresdt AS "expirationTimestamp",
  shareby_url.createddt AS "createdAt",
  shareby_url.updateddt AS "updatedAt",
  SUBSTRING(
    shareby_url.defaultaccessrole FROM (LENGTH('access.role.') + 1)
  ) AS "permissionsLevel",
  CASE
    WHEN shareby_url.maxuses = 0 THEN NULL
    ELSE shareby_url.maxuses
  END AS "maxUses",
  COALESCE(folder_link.recordid, folder_link.folderid) AS "itemId",
  CASE
    WHEN folder_link.recordid IS NOT NULL THEN 'record'
    ELSE 'folder'
  END AS "itemType",
  CASE
    WHEN shareby_url.unrestricted THEN 'none'
    WHEN shareby_url.autoapprovetoggle = 1 THEN 'account'
    ELSE 'approval'
  END AS "accessRestrictions",
  JSON_BUILD_OBJECT(
    'id',
    shareby_url.byaccountid::text,
    'name',
    account.fullname
  ) AS "creatorAccount"
FROM
  shareby_url
INNER JOIN
  account
  ON shareby_url.byaccountid = account.accountid
INNER JOIN
  folder_link
  ON shareby_url.folder_linkid = folder_link.folder_linkid
WHERE
  (
    shareby_url.shareby_urlid::text = ANY(:shareLinkIds)
    OR shareby_url.urltoken = ANY(:shareTokens)
  )
  AND (
    account.primaryemail = :email
    OR :email IS NULL
  );
