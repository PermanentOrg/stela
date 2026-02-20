SELECT
    accountid AS "accountId",
    primaryemail AS "primaryEmail"
FROM account
WHERE accountid = :accountId;
