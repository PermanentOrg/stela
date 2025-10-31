WITH existing_tags AS (
	SELECT
		tag.tagid,
		tag.name,
		tag.archiveid
	FROM
		tag
	JOIN
		file
		ON tag.archiveid = file.archiveid
	WHERE
		file.fileid = :fileId
		AND tag.type = 'type.generic.placeholder'
		AND tag.name = ANY (:fileTags)
),
new_tag_names AS (
	SELECT
		name
	FROM
		unnest(:fileTags) AS file_tags(name)
	WHERE
		name NOT IN (SELECT name FROM existing_tags)
),
new_tags AS (
	INSERT INTO tag (name, archiveid, status, type, createddt, updateddt)
	(
		SELECT
			name,
			(SELECT DISTINCT archiveId FROM existing_tags),
			'status.generic.ok',
			'type.generic.placeholder',
			CURRENT_TIMESTAMP,
			CURRENT_TIMESTAMP
		FROM
			new_tag_names
	)
	RETURNING
		tagid
),
record_to_update AS (
	SELECT recordid
	FROM
		record_file
	WHERE
		fileid = :fileId
),
new_tag_links AS (
	INSERT INTO tag_link (tagid, refid, reftable, status, type, createddt, updateddt)
	SELECT
		tagid,
		(SELECT recordid FROM record_to_update),
		'record',
		'status.generic.ok',
		'type.generic.placeholder',
		CURRENT_TIMESTAMP,
		CURRENT_TIMESTAMP
	FROM (
		SELECT tagid FROM existing_tags
		UNION
		SELECT tagid FROM new_tags
	) AS record_tags
	ON CONFLICT DO NOTHING
)

UPDATE
	record
SET
	displayname =
		CASE WHEN (displayname = uploadfilename OR displayname = REGEXP_REPLACE(uploadfilename, '\.[^.]*$', '') OR displayname IS NULL) AND :nameFromEmbeddedMetadata::text IS NOT NULL
		THEN :nameFromEmbeddedMetadata::text
		ELSE displayName
		END,
	description = COALESCE(description, :descriptionFromEmbeddedMetadata),
	deriveddt = COALESCE(deriveddt, :timestampFromEmbeddedMetadata),
	originalfilecreationtime = COALESCE(originalfilecreationtime, :timeFromEmbeddedMetadata),
	alttext = COALESCE(alttext, :altTextFromEmbeddedMetadata)
WHERE
	record.recordid = (SELECT recordid FROM record_to_update);
