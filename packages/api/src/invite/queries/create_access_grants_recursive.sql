WITH RECURSIVE grant_params AS (
  SELECT
    :archiveId::bigint AS archiveid,
    :folderLinkIds::bigint[] AS folder_linkids,
    :accessRoles::text[] AS accessroles
),

shared_grant AS (
  SELECT
    grant_params.archiveid,
    shared.folder_linkid,
    shared.accessrole
  FROM grant_params
  CROSS JOIN
    UNNEST(grant_params.folder_linkids, grant_params.accessroles)
      AS shared (folder_linkid, accessrole)
),

shared_subtree AS (
  SELECT
    shared_grant.archiveid,
    folder_link.folder_linkid,
    shared_grant.accessrole
  FROM shared_grant
  INNER JOIN folder_link
    ON shared_grant.folder_linkid = folder_link.folder_linkid

  UNION ALL

  SELECT
    shared_subtree.archiveid,
    folder_link.folder_linkid,
    shared_subtree.accessrole
  FROM folder_link
  INNER JOIN shared_subtree
    ON folder_link.parentfolder_linkid = shared_subtree.folder_linkid
  WHERE folder_link.status != 'status.generic.deleted'
)

INSERT INTO access (
  folder_linkid,
  archiveid,
  accessrole,
  status,
  type,
  createddt,
  updateddt
)
SELECT
  shared_subtree.folder_linkid,
  shared_subtree.archiveid,
  shared_subtree.accessrole,
  'status.generic.ok' AS status,
  'type.access.share' AS type,
  CURRENT_TIMESTAMP AS createddt,
  CURRENT_TIMESTAMP AS updateddt
FROM shared_subtree;
