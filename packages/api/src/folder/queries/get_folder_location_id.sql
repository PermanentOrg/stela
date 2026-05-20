SELECT locnid::text AS "locationId"
FROM folder
WHERE folderid = :folderId
FOR UPDATE;
