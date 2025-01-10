SELECT
  folder.folderid AS "folderId",
  folder.archivenbr AS "archiveNumber",
  folder.archiveid AS "archiveId",
  folder_link.folder_linkid AS "folderLinkId"
FROM
  folder
INNER JOIN
  folder_link
  ON
    folder.folderid = folder_link.folderid
WHERE
  folder.folderid IN (
    SELECT folder.folderid
    FROM
      folder
    INNER JOIN
      folder_link
      ON
        folder.folderid = folder_link.folderid
    WHERE
      folder.status != 'status.generic.deleted'
    GROUP BY folder.folderid
    HAVING
      ARRAY['status.generic.deleted'] = array_agg(folder_link.status)
      AND ARRAY[1]::int[] != array_agg(folder_link.linkcount)::int[]
  )
ORDER BY
  folder.folderid ASC;
