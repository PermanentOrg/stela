SELECT DISTINCT
  tag.tagid AS "tagId",
  tag.name,
  tag.archiveid AS "archiveId",
  tag.status,
  tag.type,
  tag.createddt AS "createdDt",
  tag.updateddt AS "updatedDt"
FROM
  tag
INNER JOIN
  tag_link
  ON tag.tagid = tag_link.tagid
LEFT JOIN
  record
  ON tag_link.refid = record.recordid AND tag_link.reftable = 'record'
LEFT JOIN
  folder
  ON tag_link.refid = folder.folderid AND tag_link.reftable = 'folder'
WHERE
  tag.archiveid = :archiveId
  AND (
    (
      record.publicdt IS NOT NULL
      AND record.publicdt <= CURRENT_TIMESTAMP
      AND record.archiveid = :archiveId
    )
    OR (
      folder.publicdt IS NOT NULL
      AND folder.publicdt <= CURRENT_TIMESTAMP
      AND folder.archiveid = :archiveId
    )
  )
  AND tag.status = 'status.generic.ok'
  AND tag_link.status = 'status.generic.ok'
  AND record.status IS DISTINCT FROM 'status.generic.deleted'
  AND folder.status IS DISTINCT FROM 'status.generic.deleted';
