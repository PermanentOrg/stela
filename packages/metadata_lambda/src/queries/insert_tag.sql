WITH insert_values (name, archiveId, status, type) AS (
  VALUES %L
), insert_results AS (
  INSERT INTO
    tag (name, archiveId, status, type, createdDt, updatedDt)
  (SELECT
    name,
    archiveId::bigint,
    status,
    type,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  FROM
    insert_values)
  ON CONFLICT DO NOTHING RETURNING tagId
 )
INSERT INTO
  tag_link (tagId, refId, refTable, status, type, createdDt, updatedDt)
(
  SELECT
    tagId,
    :recordId,
    'record',
    'status.generic.ok',
    'type.generic.placeholder',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  FROM 
    insert_results
  UNION ALL
    SELECT 
      tag.tagId,
      :recordId::bigint,
      'record',
      'status.generic.ok',
      'type.generic.placeholder',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    FROM 
      insert_values
    JOIN
      tag
    ON tag.name = insert_values.name
    AND tag.archiveId = insert_values.archiveId::bigint
    AND tag.type = insert_values.type
  WHERE
    tag.name IN %L
    AND tag.archiveId = :archiveId
    AND tag.type = 'type.generic.placeholder'
)
ON CONFLICT DO NOTHING;
