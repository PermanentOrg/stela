WITH file_insert AS (
  INSERT INTO
  file (
    size,
    format,
    parentfileid,
    contenttype,
    s3versionid,
    cloud1,
    cloud2,
    cloud3,
    archiveid,
    fileurl,
    downloadurl,
    urldt,
    status,
    type,
    cloudpath,
    createddt,
    updateddt
  ) VALUES (
    :size,
    :format,
    :parentFileId,
    :contentType,
    :s3VersionId,
    :cloud1,
    :cloud2,
    :cloud3,
    :archiveId,
    :fileUrl,
    :downloadUrl,
    :urlExpiration,
    :status,
    :type,
    :cloudPath,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  RETURNING
  fileid
)
INSERT INTO
record_file (
  recordid,
  fileid,
  status,
  type,
  createddt,
  updateddt
) VALUES (
  :recordId,
  (SELECT fileid FROM file_insert LIMIT 1),
  'status.generic.ok',
  'type.generic.placeholder',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
