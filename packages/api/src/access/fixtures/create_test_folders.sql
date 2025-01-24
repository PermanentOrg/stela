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
  'Private Folder',
  '0001-test',
  'status.generic.ok',
  CURRENT_TIMESTAMP - '2 days'::interval,
  'type.folder.private',
  NULL
),
(
  2,
  2,
  '2023-06-21',
  'Private Folder',
  '0001-test1',
  'status.generic.ok',
  CURRENT_TIMESTAMP - '2 days'::interval,
  'type.folder.private',
  NULL
),
(
  3,
  2,
  '2023-06-21',
  'Private Folder',
  '0001-test2',
  'status.generic.ok',
  CURRENT_TIMESTAMP - '2 days'::interval,
  'type.folder.private',
  NULL
),
(
  4,
  3,
  '2023-06-21',
  'Private Folder',
  '0001-test3',
  'status.generic.ok',
  CURRENT_TIMESTAMP - '2 days'::interval,
  'type.folder.private',
  NULL
),
(
  5,
  4,
  '2023-06-21',
  'Private Folder',
  '0001-test4',
  'status.generic.ok',
  CURRENT_TIMESTAMP - '2 days'::interval,
  'type.folder.private',
  NULL
),
(
  6,
  1,
  '2023-06-21',
  'Private Folder',
  '0001-test5',
  'status.generic.deleted',
  CURRENT_TIMESTAMP - '2 days'::interval,
  'type.folder.private',
  NULL
),
(
  7,
  2,
  '2023-06-21',
  'Private Folder',
  '0001-test6',
  'status.generic.ok',
  CURRENT_TIMESTAMP - '2 days'::interval,
  'type.folder.private',
  NULL
),
(
  8,
  2,
  '2023-06-21',
  'Private Folder',
  '0001-test7',
  'status.generic.ok',
  CURRENT_TIMESTAMP - '2 days'::interval,
  'type.folder.private',
  NULL
);
