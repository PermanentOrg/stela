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
  updateddt = CURRENT_TIMESTAMP
WHERE
  folderid = :folderId
RETURNING
  folderid AS "folderId";
