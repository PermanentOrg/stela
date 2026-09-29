INSERT INTO
record (
  recordid,
  archiveid,
  publicdt,
  displayname,
  uploadaccountid,
  uploadpayeraccountid,
  uploadfilename,
  downloadname,
  status,
  type
)
SELECT
  series.n AS recordid,
  105 AS archiveid,
  '2023-01-01'::TIMESTAMPTZ AS publicdt,
  'Page ' || series.n AS displayname,
  2 AS uploadaccountid,
  2 AS uploadpayeraccountid,
  'page.jpg' AS uploadfilename,
  'page.jpg' AS downloadname,
  'status.generic.ok' AS status,
  'type.record.image' AS type
FROM GENERATE_SERIES(601, 612) AS series (n);
