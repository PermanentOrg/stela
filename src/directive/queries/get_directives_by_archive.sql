SELECT
  directive.directive_id "directiveId",
  directive.archive_id "archiveId",
  directive.type,
  directive.created_dt "createdDt",
  directive.updated_dt "updatedDt",
  directive.steward_account_id "stewardAccountId",
  directive.note,
  directive.execution_dt "executionDt",
  jsonb_build_object(
    'directiveTriggerId',
    directive_trigger.directive_trigger_id,
    'directiveId',
    directive_trigger.directive_id,
    'type',
    directive_trigger.type,
    'createdDt',
    directive_trigger.created_dt,
    'updatedDt',
    directive_trigger.updated_dt
  ) "trigger"
FROM
  directive
JOIN
  directive_trigger
  ON directive.directive_id = directive_trigger.directive_id
WHERE
  directive.archive_id = :archiveId;
