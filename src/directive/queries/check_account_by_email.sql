  SELECT
    accountId "stewardAccountId"
  FROM
    account
  WHERE
    account.primaryEmail = :email;
