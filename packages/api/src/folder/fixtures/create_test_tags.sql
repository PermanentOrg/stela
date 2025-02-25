INSERT INTO tag (
  tagid,
  name,
  archiveid,
  status,
  type,
  createddt,
  updateddt
) VALUES (
  1,
  'Test Tag One',
  1,
  'status.generic.ok',
  'type.generic.placeholder',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  2,
  'Test Deleted Tag',
  1,
  'status.generic.deleted',
  'type.generic.placeholder',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  3,
  'Test Tag Two',
  1,
  'status.generic.ok',
  'type.generic.placeholder',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
