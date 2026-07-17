WITH archive_access AS (
  SELECT account_archive.archiveid
  FROM account_archive
  INNER JOIN account ON account_archive.accountid = account.accountid
  WHERE
    account.primaryemail = :email
    AND account_archive.archiveid = :archiveId
    AND account_archive.status = 'status.generic.ok'
),

all_shared_folders AS (
  SELECT DISTINCT folder_link.folderid AS "folderId"
  FROM folder_link
  INNER JOIN share ON folder_link.folder_linkid = share.folder_linkid
  INNER JOIN archive_access ON folder_link.archiveid = archive_access.archiveid
  WHERE share.status = 'status.generic.ok'
),

ranked_shared_folders AS (
  SELECT
    "folderId",
    ROW_NUMBER() OVER (ORDER BY "folderId"::BIGINT ASC) AS rank
  FROM all_shared_folders
),

cursor AS (
  SELECT rank
  FROM
    ranked_shared_folders
  WHERE
    "folderId" = :cursor
),

total_pages AS (
  SELECT CEILING(COUNT(*)::FLOAT / :pageSize) AS total_pages
  FROM all_shared_folders
)

SELECT
  ranked_shared_folders."folderId",
  (SELECT total_pages.total_pages FROM total_pages) AS "totalPages"
FROM ranked_shared_folders
WHERE
  ranked_shared_folders.rank > COALESCE((SELECT cursor.rank FROM cursor), 0)
ORDER BY ranked_shared_folders.rank ASC
LIMIT :pageSize;
