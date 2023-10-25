SELECT
  fullName "fullName"
FROM
  account
WHERE
  primaryEmail = :email;
