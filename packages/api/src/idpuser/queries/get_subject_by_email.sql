SELECT subject
FROM
  account
WHERE
  primaryemail = :email;
