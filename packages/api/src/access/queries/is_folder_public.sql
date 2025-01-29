SELECT CURRENT_TIMESTAMP > publicdt AS "isPublic"
FROM
  folder
WHERE
  folderid = :itemId;
