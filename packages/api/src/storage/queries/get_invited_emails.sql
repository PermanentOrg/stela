SELECT LOWER(email) AS email
FROM
  invite
WHERE
  LOWER(email) = ANY(:emails);
