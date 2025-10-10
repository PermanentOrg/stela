DELETE FROM
feature_flag
WHERE
  id = :featureFlagId
RETURNING
  id AS "featureFlagId";
