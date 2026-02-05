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
    SELECT orphaned_folder.folderid
    FROM
      folder AS orphaned_folder
    INNER JOIN
      folder_link AS orphaned_folder_link
      ON
        orphaned_folder.folderid = orphaned_folder_link.folderid
    WHERE
      orphaned_folder.status != 'status.generic.deleted'
    GROUP BY orphaned_folder.folderid
    HAVING
      ARRAY['status.generic.deleted'] = ARRAY_AGG(orphaned_folder_link.status)
      AND ARRAY[1]::int[] != ARRAY_AGG(orphaned_folder_link.linkcount)::int[]
  )
ORDER BY
  folder.folderid ASC;
