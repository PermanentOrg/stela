SELECT
    COALESCE(SUM(d.amount_dollars), 0)::NUMERIC(13,2) AS "totalDollars",
    COUNT(d.donationid)::INTEGER AS "totalDonations",
    COALESCE(dc.goal_dollars, 0)::NUMERIC(13,2) AS "goalDollars",
    dc.name AS "campaignName"
FROM donation d
LEFT JOIN donation_campaign dc ON dc.is_active = true
WHERE d.status = 'status.donation.completed'
GROUP BY dc.goal_dollars, dc.name;
