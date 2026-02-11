UPDATE donation
SET
    claimed = true,
    claimed_at = CURRENT_TIMESTAMP,
    updateddt = CURRENT_TIMESTAMP
WHERE donationid = :donationId
RETURNING
    donationid AS "donationId",
    claimed,
    claimed_at AS "claimedAt";
