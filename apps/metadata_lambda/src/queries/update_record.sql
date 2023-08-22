UPDATE
  record
SET
  displayName = COALESCE(:displayName, displayName),
  description = COALESCE(:description, description),
  updatedDt = CURRENT_TIMESTAMP
WHERE
  recordId = :recordId
RETURNING
  recordId,
  displayName,
  description;
