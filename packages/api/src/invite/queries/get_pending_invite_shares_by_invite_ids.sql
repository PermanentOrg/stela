SELECT
  invite_shareid AS "inviteShareId",
  folder_linkid AS "folderLinkId",
  accessrole AS "accessRole"
FROM invite_share
WHERE
  inviteid = ANY(:inviteIds::bigint[])
  AND status = 'status.invite.pending'
ORDER BY invite_shareid;
