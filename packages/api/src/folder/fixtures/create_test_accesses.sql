INSERT INTO access (
  folder_linkid,
  archiveid,
  accessrole,
  status,
  type,
  createddt,
  updateddt
) VALUES (
  1,
  5,
  'access.role.viewer',
  'status.generic.ok',
  'type.access.share',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  1,
  6,
  'access.role.viewer',
  'status.generic.deleted',
  'type.access.share',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
