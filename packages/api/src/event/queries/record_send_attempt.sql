UPDATE
  event
SET
  is_sent = :isSent,
  send_attempts = send_attempts + 1
WHERE
  id = :id;
