SELECT account_space.spaceleft AS "spaceLeft"
FROM
  account_space
INNER JOIN
  account
  ON account_space.accountid = account.accountid
WHERE
  account.primaryemail = :email
FOR NO KEY UPDATE;
