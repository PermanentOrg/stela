SELECT
  feature_flag.id,
  feature_flag.name,
  feature_flag.description,
  feature_flag.globally_enabled AS "globallyEnabled",
  feature_flag.created_at AS "createdAt",
  feature_flag.updated_at AS "updatedAt"
FROM
  feature_flag
