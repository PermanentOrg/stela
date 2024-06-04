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
  8,
  3,
  'access.role.viewer',
  'status.generic.ok',
  NOW(),
  NOW()
),
(
  2,
  8,
  2,
  'access.role.contributor',
  'status.generic.ok',
  NOW(),
  NOW()
);
