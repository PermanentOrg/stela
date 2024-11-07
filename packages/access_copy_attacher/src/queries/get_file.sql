SELECT
  file.archiveid AS "archiveId",
  record.uploadfilename AS "uploadFileName",
  record.recordid AS "recordId"
FROM
  file
INNER JOIN
  record_file
  ON
    file.fileid = record_file.fileid
INNER JOIN
  record
  ON
    record_file.recordid = record.recordid
WHERE file.fileid = :fileId;
