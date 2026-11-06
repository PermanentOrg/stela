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
  102,
  'deleted.member@permanent.org',
  'status.generic.deleted',
  '{}',
  'type.account.standard',
  'Deleted Member',
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
  102,
  102,
  1,
  'access.role.owner',
  0,
  'type.account.standard',
  'status.generic.ok',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
