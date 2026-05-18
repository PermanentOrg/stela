WITH destination_archive AS (
  SELECT
    archive.payeraccountid,
    archive.archivenbr
  FROM
    archive
  WHERE
    archive.archiveid = :destinationArchiveId
),

archive_nbr_item_parts AS (
  SELECT archive_nbr.itempart
  FROM
    archive_nbr
  WHERE
    archive_nbr.archivepart = SPLIT_PART(
      (SELECT destination_archive.archivenbr FROM destination_archive),
      '-',
      1
    )
  ORDER BY archive_nbr.archivenbrid FOR NO KEY UPDATE
),

max_archive_nbr AS (
  SELECT MAX(archive_nbr_item_parts.itempart) AS max_item_part
  FROM archive_nbr_item_parts
),

source_record AS (
  SELECT
    folder_link.parentfolderid,
    REGEXP_REPLACE(
      record.downloadname,
      ' \([0-9]+\)(\.[a-zA-Z0-9]+)?$',
      '\1'
    ) AS base_downloadname
  FROM record
  INNER JOIN folder_link ON record.recordid = folder_link.recordid
  WHERE
    record.recordid = :originalRecordId
    AND folder_link.status = 'status.generic.ok'
),

record_download_name_conflicts AS (
  SELECT record.downloadname
  FROM record
  INNER JOIN folder_link
    ON record.recordid = folder_link.recordid
  INNER JOIN source_record
    ON folder_link.parentfolderid = :destinationFolderId
  WHERE
    REGEXP_REPLACE(
      record.downloadname,
      ' \([0-9]+\)(\.[a-zA-Z0-9]+)?$',
      '\1'
    ) = source_record.base_downloadname
    AND record.status != 'status.generic.deleted'
    AND folder_link.status = 'status.generic.ok'
  ORDER BY record.recordid
  FOR NO KEY UPDATE
),

folder_download_name_conflicts AS (
  SELECT folder.downloadname
  FROM folder
  INNER JOIN folder_link
    ON folder.folderid = folder_link.folderid
  INNER JOIN source_record
    ON folder_link.parentfolderid = :destinationFolderId
  WHERE
    REGEXP_REPLACE(
      folder.downloadname,
      ' \([0-9]+\)$',
      ''
    ) = source_record.base_downloadname
    AND folder.status != 'status.generic.deleted'
    AND folder_link.status = 'status.generic.ok'
  ORDER BY folder.folderid
  FOR NO KEY UPDATE
),

download_name_conflicts AS (
  SELECT record_download_name_conflicts.downloadname
  FROM record_download_name_conflicts
  UNION
  SELECT folder_download_name_conflicts.downloadname
  FROM folder_download_name_conflicts
),

new_download_name_disambiguator AS (
  -- Gives us the smallest unused disambiguator
  -- Guaranteed to find a value because GENERATE_SERIES is inclusive of
  -- its endpoints, so this set contains one more element than the following set
  SELECT MIN(series) AS disambiguator
  FROM (
    SELECT
      GENERATE_SERIES(
        0,
        (SELECT COUNT(*) FROM download_name_conflicts)
      ) AS series
    EXCEPT
    SELECT
      COALESCE(
        SUBSTRING(
          download_name_conflicts.downloadname
          FROM ' \(([0-9]+)\)(\.[a-zA-Z0-9]+)?$'
        )::INTEGER,
        0
      )
    FROM download_name_conflicts
  ) AS unused_disambiguators
),

copier_account AS (
  SELECT
    accountid,
    subject
  FROM account
  WHERE primaryemail = :callerEmail
),

new_record AS (
  INSERT INTO
  record (
    archiveid,
    archivenbr,
    publicdt,
    displayname,
    note,
    description,
    uploadfilename,
    downloadname,
    downloadnameok,
    uploadaccountid,
    size,
    displaydt,
    deriveddt,
    displayenddt,
    derivedenddt,
    derivedcreateddt,
    timezoneid,
    locnid,
    view,
    viewproperty,
    imageratio,
    encryption,
    metatoken,
    filestatus,
    status,
    type,
    createddt,
    updateddt,
    uploadpayeraccountid,
    alttext,
    originalfilecreationtime
  )
  SELECT
    :destinationArchiveId AS archiveid,
    SPLIT_PART(
      (SELECT destination_archive.archivenbr FROM destination_archive),
      '-',
      1
    )
    || '-'
    || INCREMENT_BASE36(
      (SELECT max_archive_nbr.max_item_part FROM max_archive_nbr)
    ) AS archivenbr,
    CASE WHEN :destinationIsPublic THEN NOW() ELSE NULL END AS publicdt,
    displayname,
    note,
    description,
    uploadfilename,
    CASE
      WHEN (
        SELECT new_download_name_disambiguator.disambiguator
        FROM new_download_name_disambiguator
      ) = 0
        THEN
          displayname
          || COALESCE(
            SUBSTRING(uploadfilename FROM '(\.[a-zA-Z0-9]+)$'),
            ''
          )
      ELSE
        displayname
        || ' ('
        || (
          SELECT new_download_name_disambiguator.disambiguator
          FROM
            new_download_name_disambiguator
        )
        || ')'
        || COALESCE(
          SUBSTRING(uploadfilename FROM '(\.[a-zA-Z0-9]+)$'),
          ''
        )
    END AS downloadname,
    TRUE AS downloadnameok,
    (SELECT copier_account.accountid FROM copier_account) AS uploadaccountid,
    size,
    displaydt,
    deriveddt,
    displayenddt,
    derivedenddt,
    derivedcreateddt,
    timezoneid,
    locnid,
    view,
    viewproperty,
    imageratio,
    encryption,
    metatoken,
    'status.generic.ok' AS filestatus,
    'status.generic.ok' AS status,
    type,
    CURRENT_TIMESTAMP AS createddt,
    CURRENT_TIMESTAMP AS updateddt,
    COALESCE(
      (SELECT destination_archive.payeraccountid FROM destination_archive),
      (SELECT copier_account.accountid FROM copier_account)
    ) AS uploadpayeraccountid,
    alttext,
    originalfilecreationtime
  FROM
    record
  WHERE
    recordid = :originalRecordId
  RETURNING
    recordid,
    uploadpayeraccountid
),

new_archive_nbr AS (
  INSERT INTO
  archive_nbr (
    archivenbr,
    reftable,
    refid,
    archivepart,
    itempart,
    status,
    type,
    createddt,
    updateddt
  ) VALUES (
    SPLIT_PART((SELECT archivenbr FROM destination_archive), '-', 1)
    || '-'
    || INCREMENT_BASE36((SELECT max_item_part FROM max_archive_nbr)),
    'record',
    (SELECT recordid FROM new_record),
    SPLIT_PART((SELECT archivenbr FROM destination_archive), '-', 1),
    INCREMENT_BASE36((SELECT max_item_part FROM max_archive_nbr)),
    'status.generic.ok',
    'type.generic.placeholder',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  RETURNING archivenbr
),

copy_folder_link AS (
  INSERT INTO
  folder_link (
    recordid,
    parentfolder_linkid,
    parentfolderid,
    archiveid,
    position,
    linkcount,
    accessrole,
    status,
    type,
    createddt,
    updateddt
  )
  SELECT
    (SELECT new_record.recordid FROM new_record) AS recordid,
    parent_folder_link.folder_linkid AS parentfolder_linkid,
    parent_folder_link.folderid AS parentfolderid,
    parent_folder_link.archiveid,
    1 AS position,
    1 AS linkcount,
    parent_folder_link.accessrole,
    'status.generic.ok' AS status,
    CASE
      WHEN parent_folder_link.type LIKE '%app%' THEN 'type.folder_link.app'
      WHEN parent_folder_link.type LIKE '%public%'
        THEN 'type.folder_link.public'
      WHEN parent_folder_link.type LIKE '%private%'
        THEN 'type.folder_link.private'
    -- If no case is true this will be null, which will correctly cause an error
    END AS type,
    CURRENT_TIMESTAMP AS createddt,
    CURRENT_TIMESTAMP AS updateddt
  FROM
    folder_link AS parent_folder_link
  WHERE
    parent_folder_link.folderid = :destinationFolderId
    AND status != 'status.generic.deleted'
),

new_tag_links AS (
  INSERT INTO
  tag_link (
    tagid,
    refid,
    reftable,
    status,
    type,
    createddt,
    updateddt
  )
  SELECT
    tagid,
    (SELECT new_record.recordid FROM new_record) AS refid,
    'record' AS reftable,
    'status.generic.ok' AS status,
    'type.generic.placeholder' AS type,
    CURRENT_TIMESTAMP AS createddt,
    CURRENT_TIMESTAMP AS updateddt
  FROM
    tag_link
  WHERE
    reftable = 'record'
    AND refid = :originalRecordId
    AND status = 'status.generic.ok'
),

new_original_file AS (
  INSERT INTO
  file (
    size,
    format,
    contenttype,
    contentversion,
    s3version,
    s3versionid,
    md5checksum,
    cloud1,
    cloud2,
    cloud3,
    archiveid,
    height,
    width,
    durationinsecs,
    status,
    type,
    createddt,
    updateddt
  )
  SELECT
    file.size,
    file.format,
    file.contenttype,
    file.contentversion,
    file.s3version,
    file.s3versionid,
    file.md5checksum,
    file.cloud1,
    file.cloud2,
    file.cloud3,
    :destinationArchiveId AS archiveid,
    file.height,
    file.width,
    file.durationinsecs,
    file.status,
    file.type,
    CURRENT_TIMESTAMP AS createddt,
    CURRENT_TIMESTAMP AS updateddt
  FROM
    file
  INNER JOIN
    record_file
    ON file.fileid = record_file.fileid
  WHERE
    record_file.recordid = :originalRecordId
    AND file.format = 'file.format.original'
  RETURNING
    *
),

new_record_file AS (
  INSERT INTO
  record_file (
    recordid,
    fileid,
    status,
    type,
    createddt,
    updateddt
  ) VALUES (
    (SELECT recordid FROM new_record),
    (SELECT fileid FROM new_original_file),
    'status.generic.ok',
    'type.generic.placeholder',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
),

file_copy_event AS (
  INSERT INTO
  event (
    entity,
    action,
    version,
    actor_type,
    actor_id,
    entity_id,
    ip,
    user_agent,
    body
  )
  SELECT
    'file' AS entity,
    'copy' AS action,
    1 AS version,
    'user' AS actor_type,
    (SELECT copier_account.subject::UUID FROM copier_account) AS actor_id,
    file.fileid AS entity_id,
    :callerIp AS ip,
    :callerUserAgent AS user_agent,
    JSON_BUILD_OBJECT(
      'file',
      (SELECT ROW_TO_JSON(file)),
      'newFile',
      (
        -- We try to avoid disabling linting rules, but RF02 is the rule against
        -- unqualified references, which we can't disable globally.
        -- Unfortunately SQLFluff apparently doesn't speak PostgreSQL well
        -- to know that new_original_file here is not a column reference
        SELECT ROW_TO_JSON(new_original_file) -- noqa: RF02
        FROM new_original_file
      )
    ) AS body
  FROM
    file
  INNER JOIN
    record_file
    ON file.fileid = record_file.fileid
  WHERE
    record_file.recordid = :originalRecordId
    AND file.format = 'file.format.original'
)

SELECT recordid AS "recordId"
FROM
  new_record;
