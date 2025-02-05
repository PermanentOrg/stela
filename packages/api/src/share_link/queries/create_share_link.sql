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
  'status.generic.ok' AS "status",
  :urlToken,
  :shareUrl,
  :maxUses,
  :unlisted,
  :noApproval,
  :permissionsLevel,
  :expirationTimestamp,
  (SELECT accountid FROM account WHERE primaryemail = :email),
  folder_link.archiveid,
  CURRENT_TIMESTAMP AS "createddt",
  CURRENT_TIMESTAMP AS "updateddt"
FROM
  folder_link
WHERE
  (folder_link.recordid = :itemId AND :itemType = 'record')
  OR (folder_link.folderid = :itemId AND :itemType = 'folder')
RETURNING
shareby_urlid AS "id",
:itemId AS "itemId",
:itemType AS "itemType",
urltoken AS "token",
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
updateddt AS "updatedAt";
