INSERT INTO
account (
  accountid,
  primaryemail,
  status,
  notificationpreferences,
  type,
  fullname,
  subject
)
VALUES
(
  1,
  'test@permanent.org',
  'status.auth.ok',
  '{}',
  'type.account.standard',
  'Jack Rando',
  '315aedc2-67d5-4144-9f0d-ee547d98af9c'
),
(
  2,
  'test+1@permanent.org',
  'status.auth.ok',
  '{}',
  'type.account.standard',
  'Jill Rando',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
),
(
  3,
  'test+2@permanent.org',
  'status.auth.ok',
  '{}',
  'type.account.standard',
  'Joan Rando',
  'cccccccc-cccc-cccc-cccc-cccccccccccc'
),
(
  4,
  'test+3@permanent.org',
  'status.auth.ok',
  '{}',
  'type.account.standard',
  'Jane Rando',
  'dddddddd-dddd-dddd-dddd-dddddddddddd'
);
