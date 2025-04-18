INSERT INTO folder_link (
  folder_linkid,
  recordid,
  folderid,
  parentfolderid,
  parentfolder_linkid,
  archiveid,
  position,
  accessrole,
  status,
  type
)
VALUES
(
  1,
  NULL,
  2,
  10,
  3,
  1,
  1,
  'access.role.owner',
  'status.generic.ok',
  'type.folder_link.private'
),
(
  2,
  NULL,
  1,
  5,
  NULL,
  1,
  1,
  'access.role.owner',
  'status.generic.ok',
  'type.folder_link.private'
),
(
  3,
  NULL,
  5,
  100,
  NULL,
  1,
  1,
  'access.role.owner',
  'status.generic.ok',
  'type.folder_link.private'
),
(
  4,
  NULL,
  100,
  NULL,
  NULL,
  1,
  1,
  'access.role.owner',
  'status.generic.ok',
  'type.folder_link.private'
),
(
  5,
  NULL,
  4,
  NULL,
  NULL,
  1,
  1,
  'access.role.owner',
  'status.generic.ok',
  'type.folder_link.private'
),
(
  6,
  NULL,
  3,
  NULL,
  NULL,
  1,
  1,
  'access.role.owner',
  'status.generic.deleted',
  'type.folder_link.private'
),
(
  7,
  NULL,
  7,
  NULL,
  NULL,
  1,
  1,
  'access.role.owner',
  'status.generic.ok',
  'type.folder_link.public'
),
(
  8,
  NULL,
  12,
  2,
  1,
  1,
  1,
  'access.role.owner',
  'status.generic.ok',
  'type.folder_link.private'
),
(
  9,
  NULL,
  13,
  12,
  8,
  1,
  1,
  'access.role.owner',
  'status.generic.ok',
  'type.folder_link.private'
),
(
  10,
  NULL,
  10,
  100,
  NULL,
  1,
  1,
  'access.role.owner',
  'status.generic.ok',
  'type.folder_link.private'
),
(
  11,
  8,
  NULL,
  10,
  10,
  1,
  1,
  'access.role.owner',
  'status.generic.ok',
  'type.folder_link.private'
);
