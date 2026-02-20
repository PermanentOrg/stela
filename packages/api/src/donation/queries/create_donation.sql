INSERT INTO donation (
    accountid,
    email,
    name,
    amount_cents,
    amount_dollars,
    stripe_customer_id,
    stripe_payment_intent_id,
    anonymous,
    client,
    payment_method_last4,
    billing_zip,
    status,
    createddt,
    updateddt
)
VALUES (
    :accountId,
    :email,
    :name,
    :amountCents,
    :amountDollars,
    :stripeCustomerId,
    :stripePaymentIntentId,
    :anonymous,
    :client,
    :paymentMethodLast4,
    :billingZip,
    'status.donation.completed',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
RETURNING
    donationid AS "donationId",
    accountid AS "accountId",
    email,
    name,
    amount_cents AS "amountCents",
    amount_dollars AS "amountDollars",
    anonymous,
    claimed,
    status,
    createddt AS "createdAt";
