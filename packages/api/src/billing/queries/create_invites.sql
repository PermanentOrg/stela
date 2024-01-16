WITH from_account AS (
  SELECT
    accountId
  FROM
    account
  WHERE primaryEmail = :byAccountEmail
), from_account_space AS (
  UPDATE
    account_space
  SET
    spaceLeft = spaceLeft - :storageAmountInBytes::bigint * :recipientCount,
    spaceTotal = spaceTotal - :storageAmountInBytes::bigint * :recipientCount,
    updatedDt = CURRENT_TIMESTAMP
  WHERE
    accountId = (SELECT accountId FROM from_account)
  RETURNING
    spaceTotal,
    fileTotal
), invitations AS (
  INSERT INTO
    invite(email, giftSizeInMb, status, type, expiresDt, token, byAccountId, timesSent, createdDt, updatedDt)
  SELECT
    email,
    :storageAmountInBytes::bigint / (1024 * 1024),
    'status.invite.pending',
    'type.invite.invite_early_access',
    CURRENT_TIMESTAMP + INTERVAL '30 days',  
    token,
    (SELECT accountId FROM from_account),
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  FROM
    unnest(:emails::text[], :tokens::text[]) temp(email, token)
  RETURNING
    inviteId
)
INSERT INTO
  ledger_financial (
    type,
    spaceDelta,
    fileDelta,
    fromAccountId,
    fromSpaceBefore,
    fromSpaceLeft,
    fromSpaceTotal,
    fromFileBefore,
    fromFileLeft,
    fromFileTotal,
    toAccountId,
    toSpaceBefore,
    toSpaceLeft,
    toSpaceTotal,
    toFileBefore,
    toFileLeft,
    toFileTotal,
    status,
    createdDt,
    updatedDt
  )
  SELECT
    'type.billing.gift.purchase',
    :storageAmountInBytes,
    0,
    (SELECT accountId FROM from_account),
    (SELECT spaceTotal FROM from_account_space) + row_number() OVER () * :storageAmountInBytes::bigint,
    -- the following two fields get the same value for backward
    -- compatibility, in the long run one of them should be dropped
    -- (or potentially we should start tacking old and new values of
    -- spaceLeft here)
    (SELECT spaceTotal FROM from_account_space) + (row_number() OVER () - 1) * :storageAmountInBytes::bigint,
    (SELECT spaceTotal FROM from_account_space) + (row_number() OVER () - 1) * :storageAmountInBytes::bigint,
    -- fileTotal wasn't changed, see above commment on backward
    -- compatibility for why fromFileTotal = fromFileLeft
    (SELECT fileTotal FROM from_account_space),
    (SELECT fileTotal FROM from_account_space),
    (SELECT fileTotal FROM from_account_space),
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    'status.generic.ok',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  FROM
   invitations;
