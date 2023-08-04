SELECT
  token
FROM
  invite
JOIN
  account
  ON account.accountId = invite.byAccountId
WHERE
  account.primaryEmail = :email
  AND invite.type = 'type.invite.invite_code'
  AND invite.status = 'status.invite.revoked';
