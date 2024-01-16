SELECT
  fullName "fullName",
  primaryEmail "email"
FROM
  account
WHERE
  primaryEmail = ANY(:emails);
