SELECT
  email
FROM
  invite
WHERE
  email = ANY(:emails);
