INSERT INTO invite (
  inviteid,
  email,
  fullname,
  byarchiveid,
  byaccountid,
  token,
  status,
  type,
  createddt,
  updateddt
) VALUES (
  1,
  'pending1@example.com',
  'Carol Zhang',
  1,
  2,
  'token-1',
  'status.invite.pending',
  'type.invite.share',
  NOW(),
  NOW()
),
(
  2,
  'pending2@example.com',
  'Juan Sotos',
  1,
  2,
  'token-2',
  'status.invite.pending',
  'type.invite.share',
  NOW(),
  NOW()
),
(
  3,
  'revoked@example.com',
  'Mary Lee',
  1,
  2,
  'token-3',
  'status.invite.revoked',
  'type.invite.share',
  NOW(),
  NOW()
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
  1,
  1,
  8,
  'access.role.viewer',
  'status.invite.pending',
  'type.invite.share',
  NOW(),
  NOW()
),
(
  2,
  2,
  8,
  'access.role.editor',
  'status.invite.pending',
  'type.invite.share',
  NOW(),
  NOW()
),
(
  3,
  3,
  8,
  'access.role.viewer',
  'status.invite.pending',
  'type.invite.share',
  NOW(),
  NOW()
);
