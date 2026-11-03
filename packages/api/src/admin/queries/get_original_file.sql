SELECT
  file.fileid AS "fileId",
  file.format,
  file.cloudpath AS "cloudPath",
  (
    SELECT record.downloadname
    FROM record
    INNER JOIN record_file ON record.recordid = record_file.recordid
    WHERE record_file.fileid = file.fileid
    LIMIT 1
  ) AS "recordDownloadName"
FROM
  file
WHERE
  file.fileid = :fileId;
