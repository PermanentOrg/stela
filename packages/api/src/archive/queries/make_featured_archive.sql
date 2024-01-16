INSERT INTO
featured_archive (archive_id)
(
  SELECT archiveid
  FROM
    archive
  WHERE
    archiveid = :archiveId
    AND public IS NOT NULL
    AND public
)
ON CONFLICT DO NOTHING
RETURNING archive_id;
