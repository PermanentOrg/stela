SELECT LOWER(email) AS email
FROM
  email
WHERE
  LOWER(email) = ANY(:emails);
