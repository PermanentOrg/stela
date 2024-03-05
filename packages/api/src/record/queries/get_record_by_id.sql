SELECT
  recordid AS "recordId"
FROM
  record
WHERE
  recordid = ANY(:recordIds);
