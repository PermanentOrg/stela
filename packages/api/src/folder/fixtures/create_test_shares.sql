INSERT INTO share (
  shareid,
  folder_linkid,
  archiveid,
  accessrole,
  status,
  createddt,
  updateddt
) VALUES (
  1,
  1,
  2,
  'access.role.curator',
  'status.generic.ok',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  2,
  1,
  3,
  'access.role.curator',
  'status.generic.deleted',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
