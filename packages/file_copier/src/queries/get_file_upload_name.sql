SELECT record.uploadfilename AS "uploadFileName"
FROM
  record
INNER JOIN
  record_file
  ON record.recordid = record_file.recordid
WHERE
  record_file.fileid = :fileId;
