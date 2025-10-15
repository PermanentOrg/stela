INSERT INTO
directive (archive_id, type, steward_account_id, note)
VALUES (
  :archiveId,
  :type,
  (
    SELECT accountid
    FROM
      account
    WHERE
      primaryemail = :stewardEmail
  ),
  :note
)
RETURNING
  directive_id AS "directiveId",
  archive_id AS "archiveId",
  type,
  created_dt AS "createdDt",
  updated_dt AS "updatedDt",
  (
    SELECT
      jsonb_build_object(
        'email',
        primaryemail,
        'name',
        fullname
      )
    FROM
      account
    WHERE
      accountid = steward_account_id
  ) AS steward,
  note,
  execution_dt AS "executionDt";
