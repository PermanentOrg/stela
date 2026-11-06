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
  'duplicate@permanent.org',
  'status.auth.ok',
  '{}',
  'type.account.standard',
  'Active Duplicate',
  null
),
(
  102,
  'Duplicate@Permanent.org',
  'status.generic.deleted',
  '{}',
  'type.account.standard',
  'Deleted Duplicate',
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
  'access.role.viewer',
  0,
  'type.account.standard',
  'status.generic.ok',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
