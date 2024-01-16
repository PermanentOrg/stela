SELECT invite.token
FROM
  invite
INNER JOIN
  account
  ON invite.byaccountid = account.accountid
WHERE
  account.primaryemail = :email
  AND invite.type = 'type.invite.invite_code'
  AND invite.status = 'status.invite.revoked';
