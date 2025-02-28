WITH cursor AS (
  SELECT
    COALESCE(folder.displayname, record.displayname) AS "displayname",
    COALESCE(folder.displaydt, record.displaydt) AS "displaydt",
    COALESCE(folder.type, record.type) AS "type"
  FROM
    folder_link
  LEFT JOIN
    folder
    ON folder_link.folderid = folder.folderid
  LEFT JOIN
    record
    ON folder_link.recordid = record.recordid
  WHERE
    folder_link.folder_linkid = :cursor
),

all_children AS (
  SELECT *
  FROM (
    SELECT
      folder_link.folderid AS "id",
      'folder' AS "item_type",
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
    UNION
    SELECT
      folder_link.recordid AS "id",
      'record' AS "item_type",
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
  ) AS "children"
),

total_pages AS (
  SELECT CEILING(COUNT(*) / :pageSize) AS "total_pages"
  FROM all_children
)

SELECT
  id,
  item_type,
  displayname,
  displaydt,
  type,
  (SELECT total_pages FROM total_pages) AS "totalPages"
FROM all_children
WHERE
  CASE
    WHEN
      (SELECT displayname FROM cursor) IS NOT NULL
      AND (
        SELECT sort
        FROM folder
        WHERE folderid = :parentFolderId
      ) = 'sort.alphabetical_asc'
      THEN displayname > (SELECT displayname FROM cursor)
    ELSE TRUE
  END
  AND CASE
    WHEN
      (SELECT displayname FROM cursor) IS NOT NULL
      AND (
        SELECT sort
        FROM folder
        WHERE folderid = :parentFolderId
      ) = 'sort.alphabetical_desc'
      THEN displayname < (SELECT displayname FROM cursor)
    ELSE TRUE
  END
  AND CASE
    WHEN
      (SELECT displaydt FROM cursor) IS NOT NULL
      AND (
        SELECT sort
        FROM folder
        WHERE folderid = :parentFolderId
      ) = 'sort.display_date_asc'
      THEN displaydt > (SELECT displaydt FROM cursor)
    ELSE TRUE
  END
  AND CASE
    WHEN
      (SELECT displaydt FROM cursor) IS NOT NULL
      AND (
        SELECT sort
        FROM folder
        WHERE folderid = :parentFolderId
      ) = 'sort.display_date_desc'
      THEN displaydt < (SELECT displaydt FROM cursor)
    ELSE TRUE
  END
  AND CASE
    WHEN
      (SELECT type FROM cursor) IS NOT NULL
      AND (
        SELECT sort
        FROM folder
        WHERE folderid = :parentFolderId
      ) = 'sort.type_asc'
      THEN type > (SELECT type FROM cursor)
    ELSE TRUE
  END
  AND CASE
    WHEN
      (SELECT type FROM cursor) IS NOT NULL
      AND (
        SELECT sort
        FROM folder
        WHERE folderid = :parentFolderId
      ) = 'sort.type_desc'
      THEN type < (SELECT type FROM cursor)
    ELSE TRUE
  END
ORDER BY
  (CASE
    WHEN (
      SELECT sort
      FROM folder
      WHERE folderid = :parentFolderId
    ) = 'sort.alphabetical_asc'
      THEN displayname
  END) ASC,
  (CASE
    WHEN (
      SELECT sort
      FROM folder
      WHERE folderid = :parentFolderId
    ) = 'sort.alphabetical_desc'
      THEN displayname
  END) DESC,
  (CASE
    WHEN (
      SELECT sort
      FROM folder
      WHERE folderid = :parentFolderId
    ) = 'sort.display_date_asc'
      THEN displaydt
  END) ASC,
  (CASE
    WHEN (
      SELECT sort
      FROM folder
      WHERE folderid = :parentFolderId
    ) = 'sort.display_date_desc'
      THEN displaydt
  END) DESC,
  (CASE
    WHEN (
      SELECT sort
      FROM folder
      WHERE folderid = :parentFolderId
    ) = 'sort.type_asc'
      THEN type
  END) ASC,
  (CASE
    WHEN (
      SELECT sort
      FROM folder
      WHERE folderid = :parentFolderId
    ) = 'sort.type_desc'
      THEN type
  END) DESC
LIMIT :pageSize;
