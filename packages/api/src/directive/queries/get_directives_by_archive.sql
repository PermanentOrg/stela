SELECT
  directive.directive_id AS "directiveId",
  directive.archive_id AS "archiveId",
  directive.type,
  directive.created_dt AS "createdDt",
  directive.updated_dt AS "updatedDt",
  directive.note,
  directive.execution_dt AS "executionDt",
  JSONB_BUILD_OBJECT(
    'email',
    account.primaryemail,
    'name',
    account.fullname
  ) AS steward,
  JSONB_BUILD_OBJECT(
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
  ) AS trigger
FROM
  directive
INNER JOIN
  directive_trigger
  ON directive.directive_id = directive_trigger.directive_id
INNER JOIN
  account
  ON directive.steward_account_id = account.accountid
WHERE
  directive.archive_id = :archiveId;
