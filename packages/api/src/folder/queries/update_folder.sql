UPDATE
  folder
SET
  displaydt = CASE
    WHEN :setDisplayDateToNull THEN NULL
    ELSE COALESCE(:displayDate, displaydt)
  END,
  displayenddt = CASE
    WHEN :setDisplayEndDateToNull THEN NULL
    ELSE COALESCE(:displayEndDate, displayenddt)
  END,
  displaytime = CASE
    WHEN :setDisplayTimeToNull THEN NULL
    ELSE COALESCE(:displayTime, displaytime)
  END,
  timezone = CASE
    WHEN :setTimezoneToNull THEN NULL
    ELSE COALESCE(:timezone, timezone)
  END,
  locnid = CASE
    WHEN :setLocationIdToNull THEN NULL
    ELSE COALESCE(:locationId::bigint, locnid)
  END,
  updateddt = CURRENT_TIMESTAMP
WHERE
  folderid = :folderId
RETURNING
  folderid AS "folderId";
