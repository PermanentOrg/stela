INSERT INTO donation_public (
    donationid,
    display_name,
    amount_dollars,
    createddt
)
VALUES (
    :donationId,
    :displayName,
    :amountDollars,
    CURRENT_TIMESTAMP
)
RETURNING
    donation_publicid AS "donationPublicId",
    donationid AS "donationId",
    display_name AS "displayName",
    amount_dollars AS "amountDollars";
