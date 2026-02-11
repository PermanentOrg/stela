INSERT INTO donation (
    donationid,
    accountid,
    email,
    name,
    amount_cents,
    amount_dollars,
    stripe_customer_id,
    stripe_payment_intent_id,
    anonymous,
    claimed,
    client,
    status,
    createddt,
    updateddt
)
VALUES
    (1, 1, 'test@permanent.org', 'Test User', 5000, 50.00, 'cus_test1', 'pi_test1', false, false, 'web', 'status.donation.completed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (2, 2, 'test2@permanent.org', 'Test User 2', 10000, 100.00, 'cus_test2', 'pi_test2', false, true, 'ios', 'status.donation.completed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (3, 3, 'anonymous@permanent.org', 'Anonymous Donor', 2500, 25.00, 'cus_test3', 'pi_test3', true, false, 'android', 'status.donation.completed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;
