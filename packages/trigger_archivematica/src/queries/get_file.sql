SELECT
  file.fileid AS "fileId",
  file.cloudpath AS "filePath"
FROM
  file
INNER JOIN
  record_file
  ON
    file.fileid = record_file.fileid
WHERE
  record_file.recordid = :recordId
  AND file.format = 'file.format.original'
  AND file.status != 'status.generic.deleted';
