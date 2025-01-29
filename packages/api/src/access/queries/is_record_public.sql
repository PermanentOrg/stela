SELECT CURRENT_TIMESTAMP > publicdt AS "isPublic"
FROM
  record
WHERE
  recordid = :itemId;
