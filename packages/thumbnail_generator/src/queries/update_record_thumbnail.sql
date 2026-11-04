UPDATE
  record
SET
  thumbnail256 = :thumbnailUrl,
  thumbnail256cloudpath = :thumbnailCloudPath,
  thumbdt = LEAST(CURRENT_TIMESTAMP + INTERVAL '1 year', thumbdt),
  updateddt = CURRENT_TIMESTAMP
WHERE
  recordid = :recordId
  AND thumbnail256 IS NULL
RETURNING
  recordid;
