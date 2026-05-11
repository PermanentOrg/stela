UPDATE
  record
SET
  displayname = COALESCE(:displayName, displayname),
  location_displayname = CASE
    WHEN :setLocationToNull THEN NULL
    ELSE COALESCE(:locationDisplayName, location_displayname)
  END,
  location_sublocation = CASE
    WHEN :setLocationToNull THEN NULL
    ELSE COALESCE(:locationSublocation, location_sublocation)
  END,
  location_locality = CASE
    WHEN :setLocationToNull THEN NULL
    ELSE COALESCE(:locationLocality, location_locality)
  END,
  location_adminonename = CASE
    WHEN :setLocationToNull THEN NULL
    ELSE COALESCE(:locationAdminOneName, location_adminonename)
  END,
  location_admintwoname = CASE
    WHEN :setLocationToNull THEN NULL
    ELSE COALESCE(:locationAdminTwoName, location_admintwoname)
  END,
  location_postalcode = CASE
    WHEN :setLocationToNull THEN NULL
    ELSE COALESCE(:locationPostalCode, location_postalcode)
  END,
  location_country = CASE
    WHEN :setLocationToNull THEN NULL
    ELSE COALESCE(:locationCountry, location_country)
  END,
  location_countrycode = CASE
    WHEN :setLocationToNull THEN NULL
    ELSE COALESCE(:locationCountryCode, location_countrycode)
  END,
  location_streetnumber = CASE
    WHEN :setLocationToNull THEN NULL
    ELSE COALESCE(:locationStreetNumber, location_streetnumber)
  END,
  location_streetname = CASE
    WHEN :setLocationToNull THEN NULL
    ELSE COALESCE(:locationStreetName, location_streetname)
  END,
  location_latitude = CASE
    WHEN :setLocationToNull THEN NULL
    ELSE COALESCE(:locationLatitude, location_latitude)
  END,
  location_longitude = CASE
    WHEN :setLocationToNull THEN NULL
    ELSE COALESCE(:locationLongitude, location_longitude)
  END,
  location_altitudemeters = CASE
    WHEN :setLocationToNull THEN NULL
    ELSE COALESCE(:locationAltitudeMeters, location_altitudemeters)
  END,
  location_locationprecision = CASE
    WHEN :setLocationToNull THEN NULL
    ELSE COALESCE(:locationLocationPrecision, location_locationprecision)
  END,
  description = CASE
    WHEN :setDescriptionToNull THEN NULL
    ELSE COALESCE(:description, description)
  END,
  originalfilecreationtime = CASE
    WHEN :setDisplayTimeToNull THEN NULL
    ELSE COALESCE(:displayTime, originalfilecreationtime)
  END,
  updateddt = CURRENT_TIMESTAMP
WHERE
  recordid = :recordId
RETURNING
  recordid;
