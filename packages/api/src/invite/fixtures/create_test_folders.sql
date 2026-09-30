INSERT INTO folder (
  folderid,
  archiveid,
  displayname,
  downloadname,
  status,
  type,
  createddt,
  updateddt
) VALUES
(
  1,
  1,
  'Shared Folder',
  'Shared Folder',
  'status.generic.ok',
  'type.folder.private',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  2,
  1,
  'Nested Folder',
  'Nested Folder',
  'status.generic.ok',
  'type.folder.private',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
