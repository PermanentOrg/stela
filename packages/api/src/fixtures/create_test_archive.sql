INSERT INTO
archive (archiveid, archivenbr, payeraccountid, public, type, thumburl200, status)
VALUES
(1, '0001-0001', 2, false, 'type.archive.person', null, 'status.generic.ok'),
(2, '0001-0002', null, false, 'type.archive.person', null, 'status.generic.ok'),
(
  3,
  '0001-0003',
  null,
  true,
  'type.archive.person',
  'https://test-archive-thumbnail',
  'status.generic.ok'
),
(
  4,
  '0001-0004',
  null,
  true,
  'type.archive.person',
  'https://test-archive-thumbnail',
  'status.generic.deleted'
);
