INSERT INTO
record (
  recordid,
  archiveid,
  publicdt,
  displayname,
  uploadaccountid,
  size,
  uploadpayeraccountid,
  uploadfilename,
  downloadname,
  status,
  type,
  updateddt
)
VALUES
(
  1,
  1,
  NULL,
  'Original File',
  2,
  1024,
  2,
  'original_file.jpg',
  'original_file.jpg',
  'status.generic.ok',
  'type.record.image',
  CURRENT_TIMESTAMP
),
(
  2,
  1,
  NULL,
  'New File',
  2,
  1024,
  2,
  'new_file.jpg',
  'new_file.jpg',
  'status.generic.ok',
  'type.record.image',
  CURRENT_TIMESTAMP
);
