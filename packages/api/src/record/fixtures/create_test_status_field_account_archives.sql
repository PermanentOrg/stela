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
  2,
  100,
  'access.role.owner',
  0,
  'type.account.standard',
  'status.generic.ok',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
