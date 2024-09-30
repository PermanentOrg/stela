SELECT feature_flag.name
FROM
  feature_flag
WHERE
  feature_flag.globally_enabled = true
