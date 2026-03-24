SELECT
  accountid AS "accountId",
  fullname AS name
FROM account
WHERE stripecustomerid = :stripeCustomerId;
