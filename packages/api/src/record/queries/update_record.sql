UPDATE
  record
SET
  displayname = COALESCE(:displayName, displayname),
  locnid = CASE
    WHEN :setLocationIdToNull THEN NULL
    ELSE COALESCE(:locationId, locnid)
  END,
  description = CASE
    WHEN :setDescriptionToNull THEN NULL
    ELSE COALESCE(:description, description)
  END,
  updateddt = CURRENT_TIMESTAMP
WHERE
  recordid = :recordId
RETURNING
  recordid;
