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
  originalfilecreationtime = CASE
    WHEN :setDisplayTimeInEDTFToNull THEN NULL
    ELSE COALESCE(:displayTimeInEDTF, originalfilecreationtime)
  END,
  updateddt = CURRENT_TIMESTAMP
WHERE
  recordid = :recordId
RETURNING
  recordid;
