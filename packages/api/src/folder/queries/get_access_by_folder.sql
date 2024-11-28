SELECT
  access.accessid AS "accessId",
  access.folder_linkid AS "folderLinkId",
  access.archiveid AS "archiveId",
  access.accessrole AS "role",
  access.status AS "status",
  access.type AS "type",
  access.createddt AS "createdAt",
  access.updateddt AS "updatedAt"
FROM
  access
INNER JOIN folder_link ON access.folder_linkid = folder_link.folder_linkid
WHERE
  folder_link.status = 'status.generic.ok'
  AND folder_link.folderid = :folderId
  AND access.archiveid = :archiveId
