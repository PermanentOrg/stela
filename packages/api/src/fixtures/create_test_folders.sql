INSERT INTO
folder (
  folderid,
  archiveid,
  publicdt,
  displayname,
  status,
  createddt,
  type,
  thumburl500
)
VALUES
(
  1,
  1,
  '2023-06-21',
  'Public Folder',
  'status.generic.ok',
  CURRENT_TIMESTAMP - '2 days'::interval,
  'type.folder.public',
  NULL
),
(
  2,
  1,
  NULL,
  'Private Folder',
  'status.generic.ok',
  CURRENT_TIMESTAMP,
  'type.folder.private',
  NULL
),
(
  3,
  1,
  CURRENT_TIMESTAMP + '1 day'::interval,
  'Future Public Folder',
  'status.generic.ok',
  CURRENT_TIMESTAMP,
  'type.folder.private',
  NULL
),
(
  4,
  1,
  '2023-06-21',
  'Deleted Folder',
  'status.generic.deleted',
  CURRENT_TIMESTAMP,
  'type.folder.private',
  NULL
),
(
  5,
  2,
  '2023-06-21',
  'Public Folder',
  'status.generic.ok',
  CURRENT_TIMESTAMP,
  'type.folder.public',
  NULL
),
(
  6,
  1000,
  NULL,
  'Future Folder',
  'status.generic.ok',
  CURRENT_TIMESTAMP + '1 day'::interval,
  'type.folder.private',
  NULL
),
(
  7,
  3,
  '2023-06-21',
  'Public Root',
  'status.generic.ok',
  CURRENT_TIMESTAMP,
  'type.folder.root.public',
  'https://test-folder-thumbnail'
);
