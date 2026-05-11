SELECT locnid::text AS "locationId"
FROM record
WHERE recordid = :recordId
FOR UPDATE;
