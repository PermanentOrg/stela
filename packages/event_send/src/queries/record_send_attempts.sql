UPDATE
  event
SET
  send_attempts = send_attempts + 1,
  is_sent = id = ANY(:sentEventIds::uuid[])
WHERE
  id = ANY(:eventIds::uuid[]);
