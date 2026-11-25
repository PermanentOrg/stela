WITH archive_access AS (
  SELECT account_archive.archiveid
  FROM account_archive
  INNER JOIN account ON account_archive.accountid = account.accountid
  WHERE
    account.primaryemail = :email
    AND account_archive.archiveid = :archiveId
    AND account_archive.status = 'status.generic.ok'
),

all_shared_records AS (
  SELECT DISTINCT folder_link.recordid AS "recordId"
  FROM folder_link
  INNER JOIN share ON folder_link.folder_linkid = share.folder_linkid
  INNER JOIN archive_access ON folder_link.archiveid = archive_access.archiveid
  WHERE
    share.status = 'status.generic.ok'
    AND folder_link.recordid IS NOT NULL
    AND folder_link.status = 'status.generic.ok'
),

ranked_shared_records AS (
  SELECT
    "recordId",
    ROW_NUMBER() OVER (ORDER BY "recordId"::BIGINT ASC) AS rank
  FROM all_shared_records
),

cursor AS (
  SELECT rank
  FROM
    ranked_shared_records
  WHERE
    "recordId" = :cursor
),

total_pages AS (
  SELECT CEILING(COUNT(*)::FLOAT / :pageSize) AS total_pages
  FROM all_shared_records
)

SELECT
  ranked_shared_records."recordId",
  (SELECT total_pages.total_pages FROM total_pages) AS "totalPages"
FROM ranked_shared_records
WHERE
  ranked_shared_records.rank > COALESCE((SELECT cursor.rank FROM cursor), 0)
ORDER BY ranked_shared_records.rank ASC
LIMIT :pageSize;
