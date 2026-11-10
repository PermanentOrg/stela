UPDATE locn
SET
  name = CASE
    WHEN :setNameToNull THEN NULL
    ELSE COALESCE(:name, name)
  END,
  sublocation = CASE
    WHEN :setSublocationToNull THEN NULL
    ELSE COALESCE(:sublocation, sublocation)
  END,
  city = CASE
    WHEN :setCityToNull THEN NULL
    ELSE COALESCE(:city, city)
  END,
  adminonename = CASE
    WHEN :setStateToNull THEN NULL
    ELSE COALESCE(:state, adminonename)
  END,
  postalcode = CASE
    WHEN :setPostalCodeToNull THEN NULL
    ELSE COALESCE(:postalCode, postalcode)
  END,
  country = CASE
    WHEN :setCountryToNull THEN NULL
    ELSE COALESCE(:country, country)
  END,
  latitude = CASE
    WHEN :setLatitudeToNull THEN NULL
    ELSE COALESCE(:latitude, latitude)
  END,
  longitude = CASE
    WHEN :setLongitudeToNull THEN NULL
    ELSE COALESCE(:longitude, longitude)
  END,
  altitudemeters = CASE
    WHEN :setAltitudeMetersToNull THEN NULL
    ELSE COALESCE(:altitudeMeters, altitudemeters)
  END,
  locationprecision = CASE
    WHEN :setPrecisionToNull THEN NULL
    ELSE COALESCE(:precision, locationprecision)
  END,
  streetnumber = CASE
    WHEN :setStreetNumberToNull THEN NULL
    ELSE COALESCE(:streetNumber, streetnumber)
  END,
  streetname = CASE
    WHEN :setStreetNameToNull THEN NULL
    ELSE COALESCE(:streetName, streetname)
  END,
  locality = CASE
    WHEN :setLocalityToNull THEN NULL
    ELSE COALESCE(:locality, locality)
  END,
  updateddt = CURRENT_TIMESTAMP
WHERE locnid = :locationId::bigint
RETURNING locnid::text AS "locationId";
