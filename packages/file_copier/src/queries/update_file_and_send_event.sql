WITH update_file AS (
  UPDATE
    file
  SET
    cloudpath = :cloudPath,
    fileurl = :fileUrl,
    downloadurl = :downloadUrl,
    urldt = :urlExpirationTimestamp
  WHERE
    fileid = :newFileId
    AND cloudpath IS DISTINCT FROM :cloudPath
  RETURNING fileid
)

INSERT INTO event (
  entity,
  action,
  version,
  actor_type, actor_id,
  entity_id,
  ip,
  user_agent,
  body
)
SELECT
  'record' AS entity,
  'copy' AS action,
  2 AS version,
  'user' AS actor_type,
  actor_id,
  (
    SELECT record_file.recordid
    FROM record_file
    WHERE record_file.fileid = :originalFileId
  ) AS entity_id,
  ip,
  user_agent,
  JSON_BUILD_OBJECT(
    'analytics',
    JSON_BUILD_OBJECT(
      'event',
      'Copy Record',
      'distinctId',
      COALESCE(:env || ':', '')
      || (
        SELECT record.uploadaccountid
        FROM record
        INNER JOIN record_file ON record.recordid = record_file.recordid
        WHERE record_file.fileid = :newFileId
      ),
      'data',
      JSON_BUILD_OBJECT(
        'workspace',
        CASE
          WHEN (
            SELECT record.publicdt
            FROM record
            INNER JOIN record_file ON record.recordid = record_file.recordid
            WHERE record_file.fileid = :newFileId
          ) IS NOT NULL THEN 'Public Files'
          ELSE 'Private Files'
        END
      )
    ),
    'record',
    (
      SELECT
        JSON_BUILD_OBJECT(
          'recordId', record.recordid,
          'archiveId', record.archiveid,
          'archiveNbr', record.archivenbr,
          'publicDt', record.publicdt,
          'displayName', record.displayname,
          'note', record.note,
          'description', record.description,
          'uploadFilename', record.uploadfilename,
          'downloadName', record.downloadname,
          'downloadNameOk', record.downloadnameok,
          'uploadAccountId', record.uploadaccountid,
          'size', record.size,
          'displayDt', record.displaydt,
          'derivedDt', record.deriveddt,
          'displayEndDt', record.displayenddt,
          'derivedEndDt', record.derivedenddt,
          'derivedCreatedDt', record.derivedcreateddt,
          'timezoneId', record.timezoneid,
          'locnId', record.locnid,
          'view', record.view,
          'viewProperty', record.viewproperty,
          'imageRatio', record.imageratio,
          'encryption', record.encryption,
          'metaToken', record.metatoken,
          'refArchiveNbr', record.refarchivenbr,
          'thumbStatus', record.thumbstatus,
          'thumbUrl200', record.thumburl200,
          'thumbUrl500', record.thumburl500,
          'thumbUrl1000', record.thumburl1000,
          'thumbUrl2000', record.thumburl2000,
          'thumbDt', record.thumbdt,
          'fileStatus', record.filestatus,
          'status', record.status,
          'type', record.type,
          'processedDt', record.processeddt,
          'createdDt', record.createddt,
          'updatedDt', record.updateddt
        )
      FROM record
      WHERE record.recordid = (
        SELECT record_file.recordid
        FROM record_file
        WHERE record_file.fileid = :originalFileId
      )
    ),
    'newRecord',
    (
      SELECT
        JSON_BUILD_OBJECT(
          'recordId', record.recordid,
          'archiveId', record.archiveid,
          'archiveNbr', record.archivenbr,
          'publicDt', record.publicdt,
          'displayName', record.displayname,
          'note', record.note,
          'description', record.description,
          'uploadFilename', record.uploadfilename,
          'downloadName', record.downloadname,
          'downloadNameOk', record.downloadnameok,
          'uploadAccountId', record.uploadaccountid,
          'size', record.size,
          'displayDt', record.displaydt,
          'derivedDt', record.deriveddt,
          'displayEndDt', record.displayenddt,
          'derivedEndDt', record.derivedenddt,
          'derivedCreatedDt', record.derivedcreateddt,
          'timezoneId', record.timezoneid,
          'locnId', record.locnid,
          'view', record.view,
          'viewProperty', record.viewproperty,
          'imageRatio', record.imageratio,
          'encryption', record.encryption,
          'metaToken', record.metatoken,
          'refArchiveNbr', record.refarchivenbr,
          'thumbStatus', record.thumbstatus,
          'thumbUrl200', record.thumburl200,
          'thumbUrl500', record.thumburl500,
          'thumbUrl1000', record.thumburl1000,
          'thumbUrl2000', record.thumburl2000,
          'thumbDt', record.thumbdt,
          'fileStatus', record.filestatus,
          'status', record.status,
          'type', record.type,
          'processedDt', record.processeddt,
          'createdDt', record.createddt,
          'updatedDt', record.updateddt
        )
      FROM record
      WHERE record.recordid = (
        SELECT record_file.recordid
        FROM record_file
        WHERE record_file.fileid = :newFileId
      )
    ),
    'destination',
    (
      SELECT
        JSON_BUILD_OBJECT(
          'folderId', folder.folderid,
          'archiveNbr', folder.archivenbr,
          'archiveId', folder.archiveid,
          'displayName', folder.displayname,
          'downloadName', folder.downloadname,
          'downloadNameOk', folder.downloadnameok,
          'displayDt', folder.displaydt,
          'displayEndDt', folder.displayenddt,
          'derivedDt', folder.deriveddt,
          'derivedEndDt', folder.derivedenddt,
          'timezoneId', folder.timezoneid,
          'note', folder.note,
          'description', folder.description,
          'special', folder.special,
          'sort', folder.sort,
          'locnId', folder.locnid,
          'view', folder.view,
          'viewProperty', folder.viewproperty,
          'thumbArchiveNbr', folder.thumbarchivenbr,
          'imageRatio', folder.imageratio,
          'thumbStatus', folder.thumbstatus,
          'thumbUrl200', folder.thumburl200,
          'thumbUrl500', folder.thumburl500,
          'thumbUrl1000', folder.thumburl1000,
          'thumbUrl2000', folder.thumburl2000,
          'thumbDt', folder.thumbdt,
          'status', folder.status,
          'type', folder.type,
          'publicDt', folder.publicdt,
          'createdDt', folder.createddt,
          'updatedDt', folder.updateddt
        )
      FROM folder
      WHERE folder.folderid = (
        SELECT folder_link.parentfolderid
        FROM folder_link
        INNER JOIN record_file ON folder_link.recordid = record_file.recordid
        WHERE record_file.fileid = :newFileId
      )
    ),
    'public',
    (
      SELECT record.publicdt
      FROM record
      INNER JOIN record_file ON record.recordid = record_file.recordid
      WHERE record_file.fileid = :newFileId
    ) IS NOT NULL
  ) AS body
FROM
  event
WHERE
  id = :eventId
  AND EXISTS (SELECT update_file.fileid FROM update_file)
