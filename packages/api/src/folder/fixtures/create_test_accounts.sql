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
  'John Rando',
  '553f3cb8-b753-43ce-83af-4443a404741b'
),
(
  4,
  'test+2@permanent.org',
  'status.auth.ok',
  '{}',
  'type.account.standard',
  'Jane Rando',
  null
),
(
  5,
  'test+3@permanent.org',
  'status.generic.invited',
  '{}',
  'type.account.standard',
  'Jenny Rando',
  null
),
(
  6,
  'test+4@permanent.org',
  'status.auth.ok',
  '{}',
  'type.account.standard',
  'Jenny Rando',
  null
);
