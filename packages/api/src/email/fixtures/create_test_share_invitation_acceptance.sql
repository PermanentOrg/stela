INSERT INTO account (
  accountid, primaryemail, status, notificationpreferences, type, fullname
) VALUES
(
  1,
  'inviter@permanent.org',
  'status.auth.ok',
  '{}',
  'type.account.standard',
  'Inviter Fullname'
),
(
  2,
  'newaccount@permanent.org',
  'status.auth.ok',
  '{}',
  'type.account.standard',
  'New Account Fullname'
),
(
  3,
  'secondinviter@permanent.org',
  'status.auth.ok',
  '{}',
  'type.account.standard',
  'Second Inviter Fullname'
);

INSERT INTO archive (
  archiveid, archivenbr, public, type, status, createddt, updateddt
) VALUES
(
  1,
  '0000-0000',
  FALSE,
  'type.archive.person',
  'status.generic.ok',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  2,
  '0001-0000',
  FALSE,
  'type.archive.person',
  'status.generic.ok',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

INSERT INTO account_archive (
  account_archiveid,
  accountid,
  archiveid,
  accessrole,
  position,
  type,
  status,
  createddt,
  updateddt
) VALUES (
  1,
  2,
  2,
  'access.role.owner',
  0,
  'type.account.standard',
  'status.generic.ok',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

INSERT INTO profile_item (
  archiveid, fieldnameui, string1, status, type
) VALUES
(
  1,
  'profile.basic',
  'Inviter Archive',
  'status.generic.ok',
  'type.profile_item.basic'
),
(
  2,
  'profile.basic',
  'New Archive',
  'status.generic.ok',
  'type.profile_item.basic'
);

INSERT INTO folder (
  folderid,
  archiveid,
  displayname,
  downloadname,
  status,
  type,
  createddt,
  updateddt
) VALUES
(
  1,
  1,
  'Shared Folder',
  'Shared Folder',
  'status.generic.ok',
  'type.folder.private',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  2,
  1,
  'Second Shared Folder',
  'Second Shared Folder',
  'status.generic.ok',
  'type.folder.private',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

INSERT INTO folder_link (
  folder_linkid,
  folderid,
  archiveid,
  position,
  accessrole,
  status,
  type,
  createddt,
  updateddt
) VALUES
(
  1,
  1,
  1,
  1,
  'access.role.owner',
  'status.generic.ok',
  'type.folder_link.private',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  2,
  2,
  1,
  1,
  'access.role.owner',
  'status.generic.ok',
  'type.folder_link.private',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

INSERT INTO invite (
  inviteid,
  email,
  byarchiveid,
  byaccountid,
  token,
  status,
  type,
  createddt,
  updateddt
) VALUES
(
  1,
  'newaccount@permanent.org',
  1,
  1,
  'token-1',
  'status.invite.accepted',
  'type.invite.share',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  2,
  'newaccount@permanent.org',
  1,
  3,
  'token-2',
  'status.invite.accepted',
  'type.invite.share',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

INSERT INTO invite_share (
  invite_shareid,
  inviteid,
  folder_linkid,
  accessrole,
  status,
  type,
  createddt,
  updateddt
) VALUES
(
  1,
  1,
  1,
  'access.role.viewer',
  'status.invite.accepted',
  'type.invite.share',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  2,
  2,
  2,
  'access.role.editor',
  'status.invite.accepted',
  'type.invite.share',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
