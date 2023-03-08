INSERT INTO
  directive (archive_id, type, steward_account_id, note)
VALUES
  (:archiveId, :type, :stewardAccountId, :note)
RETURNING
  directive_id "directiveId",
  archive_id "archiveId",
  type,
  created_dt "createdDt",
  updated_dt "updatedDt",
  steward_account_id "stewardAccountId",
  note,
  execution_dt "executionDt";
