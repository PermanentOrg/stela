INSERT INTO donation_campaign (
    donation_campaignid,
    name,
    goal_dollars,
    is_active,
    start_date,
    end_date,
    createddt
)
VALUES
    (1, 'Test Campaign 2026', 100000.00, true, '2026-01-01', '2026-12-31', CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;
