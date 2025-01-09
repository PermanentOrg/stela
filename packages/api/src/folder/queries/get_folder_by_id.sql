SELECT
  folder.folderid AS "folderId",
  folder.archivenbr AS "archiveNumber",
  folder.archiveid AS "archiveId",
  folder.displaydt AS "displayDate",
  folder.displayenddt AS "displayEndDate"
FROM
  folder
WHERE folder.folderid = :folderId
