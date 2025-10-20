SELECT
  fullname AS "fullName",
  primaryemail AS email
FROM
  account
WHERE
  primaryemail = ANY(:emails);
