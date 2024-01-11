INSERT INTO
directive_trigger (directive_id, type)
VALUES (:directiveId, :type)
RETURNING
directive_trigger_id AS "directiveTriggerId",
directive_id AS "directiveId",
type,
created_dt AS "createdDt",
updated_dt AS "updatedDt";
