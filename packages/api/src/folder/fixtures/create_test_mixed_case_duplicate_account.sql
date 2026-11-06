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
  100,
  'TEST@Permanent.org',
  'status.generic.invited',
  '{}',
  'type.account.standard',
  'Old Invite',
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
  100,
  100,
  1,
  'access.role.owner',
  0,
  'type.account.standard',
  'status.generic.ok',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
