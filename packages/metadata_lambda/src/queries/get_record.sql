SELECT
  record.recordId AS "recordId",
  record.displayName AS "displayName",
  record.uploadFileName AS "uploadFileName",
  record.archiveId AS "archiveId",
  record.description,
  record.locnId AS "locnId",
  timezone.timezonePlace AS "timezonePlace"
FROM
  record
JOIN
  record_file
  ON record.recordId = record_file.recordId
LEFT JOIN
  timezone
  ON record.timezoneId = timezone.timezoneId
WHERE
  record_file.fileId = :fileId;
