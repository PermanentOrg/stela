SELECT
  invite.inviteid AS "inviteId",
  invite_share.invite_shareid AS "inviteShareId",
  invite_share.folder_linkid AS "folderLinkId",
  invite_share.accessrole AS "accessRole"
FROM invite
INNER JOIN invite_share
  ON invite.inviteid = invite_share.inviteid
WHERE
  LOWER(invite.email) = LOWER(:email)
  AND invite.status = 'status.invite.pending'
  AND invite.type = 'type.invite.share'
  AND invite_share.status = 'status.invite.pending';
