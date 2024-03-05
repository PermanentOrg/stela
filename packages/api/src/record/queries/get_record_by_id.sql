SELECT
  recordid as "recordId"
FROM
  record
WHERE
  recordid = ANY(:recordIds);
