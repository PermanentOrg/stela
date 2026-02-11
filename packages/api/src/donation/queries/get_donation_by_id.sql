SELECT
    donationid AS "donationId",
    accountid AS "accountId",
    email,
    name,
    amount_cents AS "amountCents",
    amount_dollars AS "amountDollars",
    stripe_customer_id AS "stripeCustomerId",
    stripe_payment_intent_id AS "stripePaymentIntentId",
    anonymous,
    claimed,
    claimed_at AS "claimedAt",
    client,
    payment_method_last4 AS "paymentMethodLast4",
    billing_zip AS "billingZip",
    status,
    createddt AS "createdAt",
    updateddt AS "updatedAt"
FROM donation
WHERE donationid = :donationId;
