WITH next_archive_part AS (
  SELECT
    COALESCE(INCREMENT_BASE36(MAX(archive_nbr.archivepart)), '0000')
      AS archive_part
  FROM archive_nbr
),

new_archive AS (
  INSERT INTO archive (
    archivenbr,
    public,
    allowpublicdownload,
    imageratio,
    status,
    type,
    createddt,
    updateddt
  )
  SELECT
    (SELECT archive_part FROM next_archive_part) || '-0000' AS archivenbr,
    -- These aliases are for readability only (Postgres ignores them);
    -- `is_public` avoids sqlfluff's RF04 keyword-as-identifier rule.
    FALSE AS is_public,
    TRUE AS allowpublicdownload,
    1 AS imageratio,
    'status.generic.ok' AS status,
    :archiveType AS type,
    CURRENT_TIMESTAMP AS createddt,
    CURRENT_TIMESTAMP AS updateddt
  RETURNING
    archiveid,
    archivenbr,
    public,
    allowpublicdownload,
    status,
    type
),

new_archive_nbr AS (
  INSERT INTO archive_nbr (
    archivenbr,
    reftable,
    refid,
    archivepart,
    itempart,
    status,
    type,
    createddt,
    updateddt
  )
  SELECT
    new_archive.archivenbr,
    'archive' AS reftable,
    new_archive.archiveid AS refid,
    (
      SELECT next_archive_part.archive_part FROM next_archive_part
    ) AS archivepart,
    '0000' AS itempart,
    'status.generic.ok' AS status,
    'type.generic.placeholder' AS type,
    CURRENT_TIMESTAMP AS createddt,
    CURRENT_TIMESTAMP AS updateddt
  FROM new_archive
)

SELECT
  archiveid AS "archiveId",
  archivenbr AS "archiveNbr",
  public,
  allowpublicdownload AS "allowPublicDownload",
  status,
  type,
  (
    SELECT next_archive_part.archive_part FROM next_archive_part
  ) AS "archivePart"
FROM new_archive;
