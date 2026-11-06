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
  101,
  'Mixed.Case@Permanent.org',
  'status.auth.ok',
  '{}',
  'type.account.standard',
  'Mixed Case',
  null
);

INSERT INTO
account_archive (
  account_archiveid,
  accountid,
  archiveid,
  accessrole,
  position,
  type,
  status,
  createddt,
  updateddt
)
VALUES
(
  101,
  101,
  1,
  'access.role.owner',
  0,
  'type.account.standard',
  'status.generic.ok',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
