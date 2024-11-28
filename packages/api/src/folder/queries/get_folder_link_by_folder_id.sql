SELECT
  folder_link.folder_linkid AS "folderLinkId",
  folder_link.folderid AS "folderId",
  folder_link.recordid AS "recordId",
  folder_link.parentfolder_linkid AS "parentFolderLinkId",
  folder_link.parentfolderid AS "parentFolderId",
  folder_link.archiveid AS "archiveId",
  folder_link.position AS "position",
  folder_link.linkcount AS "linkCount",
  folder_link.accessrole AS "accessRole",
  folder_link.status AS "status",
  folder_link.type AS "type",
  folder_link.sharedt AS "sharedAt",
  folder_link.createddt AS "createdAt",
  folder_link.updateddt AS "updatedAt"
FROM
  folder_link
WHERE folder_link.folderid = :folderId
