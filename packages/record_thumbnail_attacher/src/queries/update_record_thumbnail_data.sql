UPDATE
record
SET
  thumbnail256cloudpath = :thumbnail256CloudPath,
  thumbnail256 = :thumbnailUrl,
  thumbdt = LEAST(CURRENT_TIMESTAMP + INTERVAL '1 year', thumbdt),
  updateddt = CURRENT_TIMESTAMP
FROM
  record_file
WHERE
  record.recordid = record_file.recordid
  AND record_file.fileid = :fileId
RETURNING
record.recordid;
