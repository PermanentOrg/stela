UPDATE
  file
SET
  cloudpath = :newCloudPath,
  fileurl = :fileUrl,
  downloadurl = :downloadUrl,
  urldt = :urlExpirationTimestamp,
  updateddt = CURRENT_TIMESTAMP
WHERE
  fileid = :fileId
  AND cloudpath = :oldCloudPath
RETURNING
  fileid AS "fileId";
