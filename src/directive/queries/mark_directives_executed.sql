UPDATE
  directive
SET
  execution_dt = CURRENT_TIMESTAMP,
  updated_dt = CURRENT_TIMESTAMP
WHERE
  directive_id = ANY (:directiveIds);
