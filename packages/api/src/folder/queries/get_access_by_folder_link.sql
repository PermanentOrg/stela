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
WHERE
  access.folder_linkid = :folderLinkId
