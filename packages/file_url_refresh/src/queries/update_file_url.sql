UPDATE
	file
SET
	fileurl = :url,
	downloadurl = :downloadUrl,
	urldt = CURRENT_TIMESTAMP + interval '1 year',
	updateddt = CURRENT_TIMESTAMP
WHERE
	fileid = :fileId;
