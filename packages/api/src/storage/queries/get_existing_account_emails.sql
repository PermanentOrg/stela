SELECT email
FROM
  email
WHERE
  email = ANY(:emails);
