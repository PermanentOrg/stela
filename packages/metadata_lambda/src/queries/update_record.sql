UPDATE
  record
SET
  displayName = COALESCE(:displayName, displayName),
  description = COALESCE(:description, description),
  derivedDt = COALESCE(:derivedDate, derivedDt),
  timezoneId = COALESCE((SELECT timezoneId FROM timezone WHERE timezonePlace = :timezonePlace), timezoneId),
  updatedDt = CURRENT_TIMESTAMP
WHERE
  recordId = :recordId
RETURNING
  recordId,
  displayName,
  description,
  derivedDt,
  timezoneId;
