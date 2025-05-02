SELECT archive.type
FROM
  archive
INNER JOIN
  record
  ON archive.archiveid = record.archiveid
WHERE
  record.recordid = :recordId;
