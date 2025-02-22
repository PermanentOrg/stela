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
),
(
  5,
  'test_deleted_tag',
  1,
  'status.generic.deleted',
  'type.generic.placeholder',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  14,
  'Generic Tag 1',
  1,
  'status.generic.ok',
  'type.generic.placeholder',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  15,
  'Generic Tag 2',
  1,
  'status.generic.ok',
  'type.generic.placeholder',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  16,
  'Generic Tag 3',
  1,
  'status.generic.ok',
  'type.tag.metadata.CustomField',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
