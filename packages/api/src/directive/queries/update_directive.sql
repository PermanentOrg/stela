WITH original_directive AS (
  SELECT steward_account_id
  FROM
    directive
  WHERE
    directive_id = :directiveId
)
UPDATE
directive
SET
  type = COALESCE(:type, type),
  steward_account_id = CASE
    WHEN :stewardEmail::text IS NULL THEN steward_account_id
    ELSE (
      SELECT accountid
      FROM
        account
      WHERE
        primaryemail = :stewardEmail
    )
  END,
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
    JSONB_BUILD_OBJECT(
      'email',
      primaryemail,
      'name',
      fullname
    )
  FROM
    account
  WHERE
    accountid = steward_account_id
) "steward",
note,
execution_dt "executionDt",
steward_account_id != (
  SELECT steward_account_id
  FROM original_directive
) "stewardChanged";
