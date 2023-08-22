SELECT
  record.recordId AS "recordId",
  record.displayName AS "displayName",
  record.uploadFileName AS "uploadFileName",
  record.description
FROM
  record
JOIN
  record_file
  ON record.recordId = record_file.recordId
WHERE
  record_file.fileId = :fileId;
