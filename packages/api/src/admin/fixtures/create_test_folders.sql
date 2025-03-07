INSERT INTO
folder (
  folderid,
  archiveid,
  publicdt,
  displayname,
  archivenbr,
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
  '0001-test',
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
  NULL,
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
  NULL,
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
  NULL,
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
  NULL,
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
  NULL,
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
  NULL,
  'status.generic.ok',
  CURRENT_TIMESTAMP,
  'type.folder.root.public',
  'https://test-folder-thumbnail'
),
(
  8,
  2,
  '2023-06-21',
  'Deleted Folder',
  NULL,
  'status.generic.deleted',
  '2020-01-01 00:00:00',
  'type.folder.private',
  NULL
),
(
  9,
  4,
  NULL,
  'Private Root',
  NULL,
  'status.generic.ok',
  CURRENT_TIMESTAMP,
  'type.folder.root.private',
  'https://test-folder-thumbnail'
),
(
  10,
  3,
  NULL,
  'Private Root',
  NULL,
  'status.generic.ok',
  CURRENT_TIMESTAMP,
  'type.folder.root.private',
  'https://test-folder-thumbnail'
),
(
  11,
  2,
  NULL,
  'Private Root',
  NULL,
  'status.generic.ok',
  CURRENT_TIMESTAMP,
  'type.folder.root.private',
  'https://test-folder-thumbnail'
),
(
  12,
  1,
  NULL,
  'Orphaned Folder',
  '1234-1234',
  'status.generic.ok',
  CURRENT_TIMESTAMP,
  'type.folder.public',
  'https://test-folder-thumbnail'
),
(
  13,
  1,
  NULL,
  'Orphaned Folder 2',
  '1234-1235',
  'status.generic.ok',
  CURRENT_TIMESTAMP,
  'type.folder.public',
  'https://test-folder-thumbnail'
);
