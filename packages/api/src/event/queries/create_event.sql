INSERT INTO
event (
  entity,
  action,
  version,
  actor_type,
  actor_id,
  entity_id,
  ip,
  user_agent,
  body
) VALUES (
  :entity,
  :action,
  :version,
  :actorType,
  :actorId,
  :entityId,
  :ip,
  :userAgent,
  :body
)
RETURNING
id;
