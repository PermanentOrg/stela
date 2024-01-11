SELECT
  folderid AS "folderId",
  archiveid AS "archiveId"
FROM
  folder
WHERE
  createddt BETWEEN :beginTimestamp AND :endTimestamp
  AND (type IS NULL OR type NOT LIKE '%root%');
