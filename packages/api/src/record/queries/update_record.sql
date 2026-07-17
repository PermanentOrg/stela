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
  displaytime = CASE
    WHEN :setDisplayTimeToNull THEN NULL
    ELSE COALESCE(:displayTime, displaytime)
  END,
  timezone = CASE
    WHEN :setTimezoneToNull THEN NULL
    ELSE COALESCE(:timezone, timezone)
  END,
  updateddt = CURRENT_TIMESTAMP
WHERE
  recordid = :recordId
RETURNING
  recordid AS "recordId";
