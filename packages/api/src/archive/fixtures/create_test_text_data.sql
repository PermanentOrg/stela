INSERT INTO
text_data (
  text_dataid,
  valuetext,
  status,
  type,
  reftable,
  refid,
  createddt,
  updateddt
)
VALUES
(
  1,
  'This is Jack Rando''s archive description',
  'status.generic.ok',
  'type.generic.placeholder',
  'profile_item',
  5,
  NOW(),
  NOW()
),
(
  2,
  'This is Jay Rando''s public archive description',
  'status.generic.ok',
  'type.generic.placeholder',
  'profile_item',
  6,
  NOW(),
  NOW()
);
