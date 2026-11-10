SELECT
  record.type AS "recordType",
  record.thumbnail256 AS "existingThumbnail",
  file.fileid AS "fileId",
  file.cloudpath AS "cloudPath",
  file.size
FROM
  record
INNER JOIN
  record_file
  ON record.recordid = record_file.recordid
INNER JOIN
  file
  ON record_file.fileid = file.fileid
WHERE
  record.recordid = :recordId
  AND file.format = 'file.format.original'
  AND file.status != 'status.generic.deleted';
