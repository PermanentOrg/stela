UPDATE
	event
SET
	is_sent = TRUE
WHERE
	id = ANY(:eventIds);
