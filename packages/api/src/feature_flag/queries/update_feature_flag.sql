UPDATE feature_flag
SET
  description = :description,
  globally_enabled = :globally_enabled,
  updated_at = CURRENT_TIMESTAMP
WHERE (
  id = :id
) RETURNING
  id,
  name,
  description,
  globally_enabled AS "globallyEnabled",
  created_at AS "createdAt",
  updated_at AS "updatedAt";
