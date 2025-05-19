SELECT
	file.fileid AS "id",
	file.cloudpath AS "cloudPath",
	file.type AS "type",
	file.format AS "format",
	record.uploadfilename AS "uploadName"
FROM
	file
JOIN
	record_file
	ON file.fileid = record_file.fileid
JOIN
	record
	ON record_file.recordid = record.recordid
WHERE
	file.urldt IS NOT NULL
	AND file.urldt < CURRENT_TIMESTAMP + interval '1 month'
	AND file.status != 'status.generic.deleted'
LIMIT 100;
