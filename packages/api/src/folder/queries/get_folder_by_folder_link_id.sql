SELECT
  folder.folderid AS "folderId",
  folder.archivenbr AS "archiveNumber",
  folder.archiveid AS "archiveId",
  folder.displaydt AS "displayDate",
  folder.displayenddt AS "displayEndDate"
FROM
  folder
JOIN folder_link ON folder.folderId = folder_link.folderId AND folder_link.folder_linkId = :folderLinkId