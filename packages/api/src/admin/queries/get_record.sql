SELECT
  record.recordid AS "recordId",
  record.archiveid AS "archiveId",
  folder_link.parentfolderid AS "parentFolderId"
FROM
  record
INNER JOIN
  folder_link
  ON record.recordid = folder_link.recordid
WHERE
  record.recordid = :recordId;
