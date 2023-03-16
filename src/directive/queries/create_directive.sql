INSERT INTO
  directive (archive_id, type, steward_account_id, note)
VALUES (
  :archiveId,
  :type,
  (
    SELECT
      accountId
    FROM
      account
    WHERE
      primaryEmail = :stewardEmail
  ),
  :note
)
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
