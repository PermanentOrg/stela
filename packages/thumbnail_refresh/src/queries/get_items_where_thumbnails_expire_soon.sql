SELECT
  recordid AS "id",
  'record' AS "itemType",
  archivenbr AS "archiveNumber",
  thumbnail256cloudpath AS "thumbnail256CloudPath",
  thumbnail256,
  thumburl200 AS "thumbnail200",
  thumburl500 AS "thumbnail500",
  thumburl1000 AS "thumbnail1000",
  thumburl2000 AS "thumbnail2000"
FROM
  record
WHERE
  thumbdt < CURRENT_TIMESTAMP + interval '1 month'
UNION
SELECT
  folderid AS "id",
  'folder' AS "itemType",
  archivenbr AS "archiveNumber",
  thumbnail256cloudpath AS "thumbnail256CloudPath",
  thumbnail256,
  thumburl200 AS "thumbnail200",
  thumburl500 AS "thumbnail500",
  thumburl1000 AS "thumbnail1000",
  thumburl2000 AS "thumbnail2000"
FROM
  folder
WHERE
  thumbdt < CURRENT_TIMESTAMP + interval '1 month';
