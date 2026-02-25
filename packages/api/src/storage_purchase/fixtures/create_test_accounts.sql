INSERT INTO
account (
  accountid,
  primaryemail,
  status,
  notificationpreferences,
  type,
  fullname,
  stripecustomerid
)
VALUES
(
  2,
  'test@permanent.org',
  'status.auth.ok',
  '{}',
  'type.account.standard',
  'Test User',
  null
),
(
  3,
  'test+1@permanent.org',
  'status.auth.ok',
  '{}',
  'type.account.standard',
  'Test User 2',
  'cus_existing123'
);
