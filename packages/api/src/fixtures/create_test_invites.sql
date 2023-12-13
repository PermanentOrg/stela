INSERT INTO
  invite (email, byAccountId, token, status, type)
VALUES
  ('test@permanent.org', 2, 'earlyb1rd', 'status.invite.revoked', 'type.invite.invite_code'),
  ('test+already_invited@permanent.org', 3, 'earlyb1rd', 'status.invite.pending', 'type.invite.invite_early_access');
