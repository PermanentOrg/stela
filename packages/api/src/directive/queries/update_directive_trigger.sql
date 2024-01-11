UPDATE
directive_trigger
SET
  type = COALESCE(:type, directive_trigger.type),
  updated_dt = CURRENT_TIMESTAMP
FROM
  directive
WHERE
  directive.directive_id = directive_trigger.directive_id
  AND directive_trigger.directive_id = :directiveId
  AND directive.execution_dt IS NULL
RETURNING
directive_trigger_id "directiveTriggerId",
directive_trigger.directive_id "directiveId",
directive_trigger.type,
directive_trigger.created_dt "createdDt",
directive_trigger.updated_dt "updatedDt";
