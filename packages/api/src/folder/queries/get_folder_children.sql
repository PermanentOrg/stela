WITH all_children AS (
  SELECT
    id,
    item_type,
    folder_linkid,
    ROW_NUMBER() OVER (
      ORDER BY
        (CASE
          WHEN (
            SELECT folder.sort
            FROM folder
            WHERE folder.folderid = :parentFolderId
          ) = 'sort.alphabetical_asc'
            THEN displayname
        END) ASC,
        (CASE
          WHEN (
            SELECT folder.sort
            FROM folder
            WHERE folder.folderid = :parentFolderId
          ) = 'sort.alphabetical_desc'
            THEN displayname
        END) DESC,
        (CASE
          WHEN (
            SELECT folder.sort
            FROM folder
            WHERE folder.folderid = :parentFolderId
          ) = 'sort.display_date_asc'
            THEN displaydt
        END) ASC,
        (CASE
          WHEN (
            SELECT folder.sort
            FROM folder
            WHERE folder.folderid = :parentFolderId
          ) = 'sort.display_date_desc'
            THEN displaydt
        END) DESC,
        (CASE
          WHEN (
            SELECT folder.sort
            FROM folder
            WHERE folder.folderid = :parentFolderId
          ) = 'sort.type_asc'
            THEN type
        END) ASC,
        (CASE
          WHEN (
            SELECT folder.sort
            FROM folder
            WHERE folder.folderid = :parentFolderId
          ) = 'sort.type_desc'
            THEN type
        END) DESC
    ) AS rank
  FROM (
    SELECT
      folder_link.folderid AS id,
      'folder' AS item_type,
      folder_link.folder_linkid,
      folder.displayname,
      folder.displaydt,
      folder.type
    FROM
      folder_link
    INNER JOIN
      folder
      ON folder_link.folderid = folder.folderid
    WHERE
      folder_link.parentfolderid = :parentFolderId
      AND folder_link.status != 'status.generic.deleted'
      AND folder.status != 'status.generic.deleted'
    UNION
    SELECT
      folder_link.recordid AS id,
      'record' AS item_type,
      folder_link.folder_linkid,
      record.displayname,
      record.displaydt,
      record.type
    FROM
      folder_link
    INNER JOIN
      record
      ON folder_link.recordid = record.recordid
    WHERE
      folder_link.parentfolderid = :parentFolderId
      AND folder_link.status != 'status.generic.deleted'
      AND record.status != 'status.generic.deleted'
  ) AS children
),

cursor AS (
  SELECT rank
  FROM
    all_children
  WHERE
    folder_linkid = :cursor
),

total_pages AS (
  SELECT CEILING(COUNT(*) / :pageSize) AS total_pages
  FROM all_children
)

SELECT
  id,
  item_type,
  (SELECT total_pages.total_pages FROM total_pages) AS "totalPages"
FROM all_children
WHERE
  rank > COALESCE((SELECT cursor.rank FROM cursor), 0)
ORDER BY rank ASC
LIMIT :pageSize;
