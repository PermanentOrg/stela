INSERT INTO account_archive (
  accountid,
  archiveid,
  accessrole,
  position,
  type,
  status,
  createddt,
  updateddt
) VALUES (
  (
    SELECT accountid
    FROM
      account
    WHERE
      subject = :accountSubject
  ),
  :archiveId,
  'access.role.owner',
  0,
  'type.account.standard',
  'status.generic.ok',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
