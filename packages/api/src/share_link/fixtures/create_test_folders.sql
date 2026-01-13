INSERT INTO
folder (
  folderid,
  archiveid,
  publicdt,
  displayname,
  downloadname,
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
  'Private Folder',
  '0001-test',
  'status.generic.ok',
  CURRENT_TIMESTAMP - '2 days'::interval,
  'type.folder.private',
  NULL
);
