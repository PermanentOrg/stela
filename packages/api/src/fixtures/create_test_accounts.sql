INSERT INTO
account (
  accountid,
  primaryemail,
  status,
  notificationpreferences,
  type,
  fullname
)
VALUES
(
  2,
  'test@permanent.org',
  'status.auth.ok',
  '{}',
  'type.account.standard',
  'Jack Rando'
),
(
  3,
  'test+1@permanent.org',
  'status.auth.ok',
  '{}',
  'type.account.standard',
  'John Rando'
),
(
  4,
  'test+2@permanent.org',
  'status.auth.ok',
  '{}',
  'type.account.standard',
  'Jane Rando'
);
