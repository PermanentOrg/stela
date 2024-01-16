WITH from_account AS (
  SELECT
    accountId
  FROM
    account
  WHERE
    primaryEmail = :fromEmail
), to_account AS (
  SELECT
    accountId
  FROM
    account
  WHERE
    primaryEmail = ANY(:toEmails)
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
), to_account_space AS (
  UPDATE
    account_space
  SET
    spaceLeft = spaceLeft + :storageAmountInBytes,
    spaceTotal = spaceTotal + :storageAmountInBytes,
    updatedDt = CURRENT_TIMESTAMP
  FROM
    to_account
  WHERE
    account_space.accountId = to_account.accountId
  RETURNING
    to_account.accountId,
    spaceTotal,
    fileTotal
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
    'type.billing.gift.account_to_account',
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
    accountId,
    spaceTotal - :storageAmountInBytes,
    -- same backward compatibility reasoning as above applies here
    spaceTotal,
    spaceTotal,
    -- fileTotal wasn't changed, see above commment on backward
    -- compatibility for why toFileTotal = toFileLeft
    fileTotal,
    fileTotal,
    fileTotal,
    'status.generic.ok',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  FROM
    to_account_space;
