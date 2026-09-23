SELECT
  inviter_account.primaryemail AS "inviterEmail",
  inviter_account.fullname AS "inviterFullName",
  new_account.fullname AS "newAccountFullName",
  invite_share.accessrole AS "accessRole",
  COALESCE(
    shared_record.displayname, shared_folder.displayname
  ) AS "shareName"
FROM invite
INNER JOIN account AS new_account
  ON
    LOWER(invite.email) = LOWER(new_account.primaryemail)
INNER JOIN account AS inviter_account
  ON invite.byaccountid = inviter_account.accountid
INNER JOIN invite_share ON invite.inviteid = invite_share.inviteid
LEFT JOIN folder_link
  ON invite_share.folder_linkid = folder_link.folder_linkid
LEFT JOIN record AS shared_record
  ON folder_link.recordid = shared_record.recordid
LEFT JOIN folder AS shared_folder
  ON
    folder_link.folderid = shared_folder.folderid
    AND folder_link.recordid IS NULL
WHERE
  invite.inviteid = ANY(:inviteIds)
  AND invite.type = 'type.invite.share'
  AND invite.status = 'status.invite.accepted'
ORDER BY invite.inviteid DESC;
