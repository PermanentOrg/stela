WITH record_archive AS (
  SELECT archiveid
  FROM record
  WHERE recordid = :recordId
)

SELECT
  EXISTS (
    SELECT 1
    FROM record
    WHERE
      locnid = :locationId::bigint
      AND archiveid = (SELECT record_archive.archiveid FROM record_archive)
  )
  OR EXISTS (
    SELECT 1
    FROM folder
    WHERE
      locnid = :locationId::bigint
      AND archiveid = (SELECT record_archive.archiveid FROM record_archive)
  ) AS "isInArchive";
