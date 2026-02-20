INSERT INTO account (
    accountid,
    primaryemail,
    fullname,
    status,
    notificationpreferences,
    type,
    createddt,
    updateddt
)
VALUES
    (1, 'test@permanent.org', 'Test User', 'status.auth.ok', '{}', 'type.account.standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (2, 'test2@permanent.org', 'Test User 2', 'status.auth.ok', '{}', 'type.account.standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (3, 'anonymous@permanent.org', 'Anonymous Donor', 'status.auth.ok', '{}', 'type.account.standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;
