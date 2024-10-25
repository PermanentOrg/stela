INSERT INTO feature_flag (
  name,
  description,
  globally_enabled
) VALUES (
  :name,
  :description,
  :globally_enabled
) RETURNING
id,
name,
description,
globally_enabled AS "globallyEnabled",
created_at AS "createdAt",
updated_at AS "updatedAt";
