SELECT DISTINCT
    tag.tagId "tagId",
    tag.name,
    tag.archiveId "archiveId",
    tag.status,
    tag.type,
    tag.createdDt "createdDt",
    tag.updatedDt "updatedDt"
FROM
  tag
JOIN
  tag_link
  ON tag.tagId = tag_link.tagId
LEFT JOIN
  record
  ON tag_link.refId = record.recordId AND tag_link.refTable = 'record'
LEFT JOIN
  folder
  ON tag_link.refId = folder.folderId AND tag_link.refTable = 'folder'
WHERE
  tag.archiveId = :archiveId 
  AND (
    (record.publicDt IS NOT NULL AND record.publicDt <= CURRENT_TIMESTAMP AND record.archiveId = :archiveId)
    OR (folder.publicDt IS NOT NULL AND folder.publicDt <= CURRENT_TIMESTAMP AND folder.archiveId = :archiveId)
  )
  AND tag.status = 'status.generic.ok'
  AND tag_link.status = 'status.generic.ok'
  AND record.status IS DISTINCT FROM 'status.generic.deleted'
  AND folder.status IS DISTINCT FROM 'status.generic.deleted';
