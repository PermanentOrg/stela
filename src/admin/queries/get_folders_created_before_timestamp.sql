SELECT
  folderId AS "folderId",
  archiveId AS "archiveId"
FROM
  folder
WHERE
  createdDT BETWEEN :beginTimestamp AND :endTimestamp
  AND (type IS NULL OR type NOT LIKE '%root%');
