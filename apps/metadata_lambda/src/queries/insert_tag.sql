INSERT INTO
  tag (name, archiveId, status, type, createdDt, updatedDt)
VALUES
  %s
RETURNING
  name,
  archiveId AS "archiveId",
  status,
  type,
  createdDt,
  updatedDt;
