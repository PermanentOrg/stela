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
  2,
  'test@permanent.org',
  'status.auth.ok',
  '{}',
  'type.account.standard',
  'Jack Rando',
  null
),
(
  3,
  'test+1@permanent.org',
  'status.auth.ok',
  '{}',
  'type.account.standard',
  'Jack Rando',
  null
),
(
  4,
  'test+2@permanent.org',
  'status.generic.deleted',
  '{}',
  'type.account.standard',
  'Jack Rando',
  null
);
