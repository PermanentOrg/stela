WITH new_share_link AS (
  INSERT INTO shareby_url (
    folder_linkid,
    status,
    urltoken,
    shareurl,
    maxuses,
    unrestricted,
    autoapprovetoggle,
    defaultaccessrole,
    expiresdt,
    byaccountid,
    byarchiveid,
    createddt,
    updateddt
  ) SELECT
    folder_link.folder_linkid,
    'status.generic.ok' AS status,
    :urlToken,
    :shareUrl,
    :maxUses,
    :unlisted,
    :noApproval,
    :permissionsLevel,
    :expirationTimestamp,
    (
      SELECT account.accountid
      FROM
        account
      WHERE
        account.primaryemail = :email
    ),
    folder_link.archiveid,
    CURRENT_TIMESTAMP AS createddt,
    CURRENT_TIMESTAMP AS updateddt
  FROM
    folder_link
  WHERE
    (folder_link.recordid = :itemId AND :itemType = 'record')
    OR (folder_link.folderid = :itemId AND :itemType = 'folder')
  RETURNING
    shareby_urlid AS id,
    :itemId AS "itemId",
    :itemType AS "itemType",
    urltoken AS token,
    SUBSTRING(
      defaultaccessrole FROM (LENGTH('access.role.') + 1)
    ) AS "permissionsLevel",
    CASE
      WHEN unrestricted THEN 'none'
      WHEN autoapprovetoggle = 1 THEN 'account'
      ELSE 'approval'
    END AS "accessRestrictions",
    CASE
      WHEN maxuses = 0 THEN NULL
      ELSE maxuses
    END AS "maxUses",
    uses AS "usesExpended",
    expiresdt AS "expirationTimestamp",
    createddt AS "createdAt",
    updateddt AS "updatedAt",
    byaccountid
)

SELECT
  new_share_link.id,
  new_share_link."itemId",
  new_share_link."itemType",
  new_share_link.token,
  new_share_link."permissionsLevel",
  new_share_link."accessRestrictions",
  new_share_link."maxUses",
  new_share_link."usesExpended",
  new_share_link."expirationTimestamp",
  new_share_link."createdAt",
  new_share_link."updatedAt",
  JSON_BUILD_OBJECT(
    'id',
    new_share_link.byaccountid::text,
    'name',
    account.fullname
  ) AS "creatorAccount"
FROM
  new_share_link
INNER JOIN
  account
  ON
    new_share_link.byaccountid = account.accountid;
