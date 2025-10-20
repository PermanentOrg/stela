UPDATE
  shareby_url
SET
  defaultaccessrole = COALESCE(:permissionsLevel, defaultaccessrole),
  unrestricted = COALESCE(:unlisted, unrestricted),
  autoapprovetoggle = COALESCE(:noApproval, autoapprovetoggle),
  maxuses = CASE
    WHEN :setMaxUsesToNull THEN NULL
    ELSE COALESCE(:maxUses, maxuses)
  END,
  expiresdt = CASE
    WHEN :setExpirationTimestampToNull THEN NULL
    ELSE COALESCE(:expirationTimestamp, expiresdt)
  END
FROM
  account, folder_link
WHERE
  shareby_urlid = :shareLinkId
  AND account.accountid = shareby_url.byaccountid
  AND account.primaryemail = :email
  AND folder_link.folder_linkid = shareby_url.folder_linkid
RETURNING
  shareby_url.shareby_urlid AS id,
  COALESCE(folder_link.recordid, folder_link.folderid) AS "itemId",
  CASE
    WHEN folder_link.recordid IS NOT NULL THEN 'record'
    ELSE 'folder'
  END AS "itemType",
  shareby_url.urltoken AS token,
  SUBSTRING(
    shareby_url.defaultaccessrole FROM (LENGTH('access.role.') + 1)
  ) AS "permissionsLevel",
  CASE
    WHEN shareby_url.unrestricted THEN 'none'
    WHEN shareby_url.autoapprovetoggle = 0 THEN 'approval'
    ELSE 'account'
  END AS "accessRestrictions",
  CASE
    WHEN shareby_url.maxuses = 0 THEN NULL
    ELSE shareby_url.maxuses
  END AS "maxUses",
  shareby_url.uses AS "usesExpended",
  shareby_url.expiresdt AS "expirationTimestamp",
  JSON_BUILD_OBJECT(
    'id',
    byaccountid::text,
    'name',
    (
      SELECT account.fullname
      FROM
        account
      WHERE
        account.accountid = shareby_url.byaccountid
    )
  ) AS "creatorAccount",
  shareby_url.createddt AS "createdAt",
  shareby_url.updateddt AS "updatedAt";
