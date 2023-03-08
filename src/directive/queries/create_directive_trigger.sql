INSERT INTO
  directive_trigger (directive_id, type)
  VALUES (:directiveId, :type)
RETURNING
  directive_trigger_id "directiveTriggerId",
  directive_id "directiveId",
  type,
  created_dt "createdDt",
  updated_dt "updatedDt";
