UPDATE
  event
SET
  send_attempts = send_attempts + 1,
  is_sent = is_sent OR id = ANY(:sentEventIds::uuid[])
WHERE
  id = ANY(:eventIds::uuid[]);
