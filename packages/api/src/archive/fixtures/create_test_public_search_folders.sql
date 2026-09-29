INSERT INTO
folder (
  folderid,
  archiveid,
  publicdt,
  displayname,
  description,
  downloadname,
  status,
  createddt,
  type
)
VALUES
(
  301,
  101,
  '2023-01-01',
  'Underground Railroad Maps',
  NULL,
  'Underground Railroad Maps',
  'status.generic.ok',
  CURRENT_TIMESTAMP,
  'type.folder.public'
),
(
  302,
  101,
  NULL,
  'Harriet Drafts',
  NULL,
  'Harriet Drafts',
  'status.generic.ok',
  CURRENT_TIMESTAMP,
  'type.folder.private'
),
(
  303,
  101,
  CURRENT_TIMESTAMP + '1 day'::INTERVAL,
  'Harriet Future Folder',
  NULL,
  'Harriet Future Folder',
  'status.generic.ok',
  CURRENT_TIMESTAMP,
  'type.folder.public'
),
(
  304,
  101,
  '2023-01-01',
  'Harriet Deleted Folder',
  NULL,
  'Harriet Deleted Folder',
  'status.generic.deleted',
  CURRENT_TIMESTAMP,
  'type.folder.public'
),
(
  305,
  101,
  '2023-01-01',
  'Public',
  NULL,
  'Public',
  'status.generic.ok',
  CURRENT_TIMESTAMP,
  'type.folder.root.public'
),
(
  306,
  103,
  '2023-01-01',
  'Harriet Letters',
  NULL,
  'Harriet Letters',
  'status.generic.ok',
  CURRENT_TIMESTAMP,
  'type.folder.public'
);
