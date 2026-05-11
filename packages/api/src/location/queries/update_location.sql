UPDATE locn
SET
  name = COALESCE(:name, name),
  sublocation = COALESCE(:sublocation, sublocation),
  city = COALESCE(:city, city),
  adminonename = COALESCE(:state, adminonename),
  postalcode = COALESCE(:postalCode, postalcode),
  country = COALESCE(:country, country),
  latitude = COALESCE(:latitude, latitude),
  longitude = COALESCE(:longitude, longitude),
  altitudemeters = COALESCE(:altitudeMeters, altitudemeters),
  locationprecision = COALESCE(:precision, locationprecision),
  streetnumber = COALESCE(:streetNumber, streetnumber),
  streetname = COALESCE(:streetName, streetname),
  locality = COALESCE(:locality, locality),
  updateddt = CURRENT_TIMESTAMP
WHERE locnid = :locationId::bigint
RETURNING locnid::text AS "locationId";
