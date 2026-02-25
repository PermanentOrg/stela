SELECT
  stripecustomerid AS "stripeCustomerId",
  fullname AS name,
  accountid AS "accountId"
FROM account
WHERE primaryemail = :email;
