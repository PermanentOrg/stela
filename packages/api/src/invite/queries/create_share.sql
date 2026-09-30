WITH share_params AS (
  SELECT
    :archiveId::bigint AS archiveid,
    :folderLinkIds::bigint[] AS folder_linkids,
    :accessRoles::text[] AS accessroles
),

new_share AS (
  SELECT
    share_params.archiveid,
    shared.folder_linkid,
    shared.accessrole
  FROM share_params
  CROSS JOIN
    UNNEST(share_params.folder_linkids, share_params.accessroles)
      AS shared (folder_linkid, accessrole)
)

INSERT INTO share (
  folder_linkid,
  archiveid,
  accessrole,
  status,
  type,
  createddt,
  updateddt
)
SELECT
  new_share.folder_linkid,
  new_share.archiveid,
  new_share.accessrole,
  'status.generic.ok' AS status,
  CASE
    WHEN folder_link.recordid IS NULL THEN 'type.share.folder'
    ELSE 'type.share.record'
  END AS type,
  CURRENT_TIMESTAMP AS createddt,
  CURRENT_TIMESTAMP AS updateddt
FROM new_share
INNER JOIN folder_link
  ON new_share.folder_linkid = folder_link.folder_linkid
WHERE NOT EXISTS (
  SELECT existing_share.shareid
  FROM share AS existing_share
  WHERE
    existing_share.folder_linkid = new_share.folder_linkid
    AND existing_share.archiveid = new_share.archiveid
);
