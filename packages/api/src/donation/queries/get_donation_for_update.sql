SELECT
    donationid AS "donationId",
    accountid AS "accountId",
    email,
    name,
    amount_cents AS "amountCents",
    amount_dollars AS "amountDollars",
    anonymous,
    claimed,
    claimed_at AS "claimedAt",
    status
FROM donation
WHERE donationid = :donationId
FOR NO KEY UPDATE;
