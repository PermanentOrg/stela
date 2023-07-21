SELECT
  folderId AS "folderId",
  archiveId AS "archiveId"
FROM
  folder
WHERE
  createdDT < :cutoffTimestamp
