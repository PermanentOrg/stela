WITH new_folder AS (
  INSERT INTO folder (
    archiveid,
    archivenbr,
    displayname,
    downloadname,
    description,
    type,
    status,
    publicdt,
    createddt,
    updateddt
  ) VALUES (
    :archiveId,
    :archiveNbr,
    :displayName,
    :downloadName,
    :description,
    :type,
    'status.generic.ok',
    :publicDt,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  RETURNING folderid
),

new_archive_nbr AS (
  INSERT INTO archive_nbr (
    archivenbr,
    reftable,
    refid,
    archivepart,
    itempart,
    status,
    type,
    createddt,
    updateddt
  )
  SELECT
    :archiveNbr,
    'folder' AS reftable,
    folderid,
    :archivePart,
    :itemPart,
    'status.generic.ok' AS status,
    'type.generic.placeholder' AS type,
    CURRENT_TIMESTAMP AS createddt,
    CURRENT_TIMESTAMP AS updateddt
  FROM new_folder
),

new_folder_link AS (
  INSERT INTO folder_link (
    folderid,
    parentfolderid,
    parentfolder_linkid,
    archiveid,
    position,
    accessrole,
    status,
    type,
    createddt,
    updateddt
  )
  SELECT
    folderid,
    :parentFolderId,
    :parentFolderLinkId,
    :archiveId,
    :position,
    'access.role.owner' AS accessrole,
    'status.generic.ok' AS status,
    :folderLinkType,
    CURRENT_TIMESTAMP AS createddt,
    CURRENT_TIMESTAMP AS updateddt
  FROM new_folder
  RETURNING folder_linkid
)

SELECT
  new_folder.folderid AS "folderId",
  new_folder_link.folder_linkid AS "folderLinkId"
FROM new_folder
CROSS JOIN new_folder_link;
