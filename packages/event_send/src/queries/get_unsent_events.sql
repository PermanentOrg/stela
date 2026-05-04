SELECT
	id,
	entity,
	action,
	version,
	actor_type AS "actorType",
	actor_id AS "actorId",
	entity_id AS "entityId",
	ip,
	user_agent AS "userAgent",
	body
FROM
	event
WHERE
	is_sent = FALSE;
