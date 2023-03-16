UPDATE
  directive
SET
  type = COALESCE(:type, type),
  steward_account_id = COALESCE(
    (SELECT
      accountId
    FROM
      account
    WHERE
      primaryEmail = :stewardEmail),
    steward_account_id
  ),
  note = COALESCE(:note, note),
  updated_dt = CURRENT_TIMESTAMP
WHERE
  directive_id = :directiveId
  AND execution_dt IS NULL
RETURNING
  directive_id "directiveId",
  archive_id "archiveId",
  type,
  created_dt "createdDt",
  updated_dt "updatedDt",
  (
    SELECT
      primaryEmail
    FROM
      account
    WHERE
      accountId = steward_account_id
  ) "stewardEmail",
  note,
  execution_dt "executionDt";