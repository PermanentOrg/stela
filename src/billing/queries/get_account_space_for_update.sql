SELECT
  spaceLeft "spaceLeft"
FROM
  account_space
JOIN
  account
  ON account_space.accountId = account.accountId
WHERE
  account.primaryEmail = :email
FOR NO KEY UPDATE;
