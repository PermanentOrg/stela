INSERT INTO archive (
  archiveid, archivenbr, public, type, status, createddt, updateddt
) VALUES (
  500,
  '0500-0000',
  FALSE,
  'type.archive.person',
  'status.generic.ok',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
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
) VALUES (
  500,
  500,
  'Shared Folder',
  'Shared Folder',
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
) VALUES (
  500,
  500,
  500,
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
) VALUES (
  500,
  'newarchiveowner@permanent.org',
  500,
  2,
  'token-500',
  'status.invite.pending',
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
) VALUES (
  500,
  500,
  500,
  'access.role.viewer',
  'status.invite.pending',
  'type.invite.share',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
