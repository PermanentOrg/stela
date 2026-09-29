-- Search public archives, and the public content inside them, for words
-- that start with each word of :query. The user's text is split into words
-- by the text search parser, and each word is quoted and escaped before it is
-- turned into a prefix query, so operators and punctuation in :query have no
-- special meaning. Comparisons use the 'simple' configuration so that they
-- match the existing full-text indexes on folder, record and profile_item.
WITH search_terms AS MATERIALIZED (
  SELECT
    TO_TSQUERY(
      'simple',
      ARRAY_TO_STRING(
        ARRAY(
          SELECT
            ''''
            || REPLACE(
              REPLACE(word, CHR(92), CHR(92) || CHR(92)), '''', ''''''
            )
            || ''':*'
          FROM
            UNNEST(TSVECTOR_TO_ARRAY(TO_TSVECTOR('simple', :query))) AS word
        ),
        ' & '
      )
    ) AS ts_query
),

public_archive AS MATERIALIZED (
  SELECT
    archive.archiveid,
    basic_profile_item.string1 AS name,
    archive.thumburl200,
    archive.thumburl500,
    archive.thumburl1000,
    archive.thumburl2000
  FROM
    archive
  INNER JOIN
    profile_item AS basic_profile_item
    ON
      archive.archiveid = basic_profile_item.archiveid
      AND basic_profile_item.fieldnameui = 'profile.basic'
      AND basic_profile_item.status != 'status.generic.deleted'
  WHERE
    archive.public
    AND archive.status != 'status.generic.deleted'
),

archive_name_match AS (
  SELECT public_archive.archiveid
  FROM
    public_archive
  WHERE
    TO_TSVECTOR('simple', public_archive.name)
    @@ (SELECT search_terms.ts_query FROM search_terms)
),

milestone_candidate AS (
  SELECT
    milestone.archiveid,
    milestone.profile_itemid,
    milestone.string1 AS title,
    milestone.string2 AS description,
    milestone.day1,
    COALESCE(
      TO_TSVECTOR('simple', milestone.string1)
      @@ (SELECT search_terms.ts_query FROM search_terms),
      FALSE
    ) AS title_matched,
    COALESCE(
      TO_TSVECTOR('simple', milestone.string2)
      @@ (SELECT search_terms.ts_query FROM search_terms),
      FALSE
    ) AS description_matched
  FROM
    profile_item AS milestone
  INNER JOIN
    public_archive
    ON milestone.archiveid = public_archive.archiveid
  WHERE
    milestone.fieldnameui = 'profile.milestone'
    AND milestone.status != 'status.generic.deleted'
    AND milestone.publicdt IS NOT NULL
    AND milestone.publicdt <= CURRENT_TIMESTAMP
),

milestone_match AS (
  SELECT
    milestone_candidate.archiveid,
    milestone_candidate.profile_itemid,
    milestone_candidate.title,
    milestone_candidate.description,
    milestone_candidate.day1,
    milestone_candidate.title_matched,
    milestone_candidate.description_matched
  FROM
    milestone_candidate
  WHERE
    milestone_candidate.title_matched
    OR milestone_candidate.description_matched
),

folder_match AS (
  SELECT
    folder.archiveid,
    'folder'::TEXT AS item_type,
    folder.folderid AS item_id,
    COALESCE(
      TO_TSVECTOR('simple', folder.displayname)
      @@ (SELECT search_terms.ts_query FROM search_terms),
      FALSE
    ) AS name_matched,
    COALESCE(
      TO_TSVECTOR('simple', folder.description)
      @@ (SELECT search_terms.ts_query FROM search_terms),
      FALSE
    ) AS description_matched
  FROM
    folder
  INNER JOIN
    public_archive
    ON folder.archiveid = public_archive.archiveid
  WHERE
    (
      TO_TSVECTOR('simple', folder.displayname)
      @@ (SELECT search_terms.ts_query FROM search_terms)
      OR TO_TSVECTOR('simple', folder.description)
      @@ (SELECT search_terms.ts_query FROM search_terms)
    )
    AND folder.publicdt IS NOT NULL
    AND folder.publicdt <= CURRENT_TIMESTAMP
    AND folder.status != 'status.generic.deleted'
    AND folder.type NOT LIKE 'type.folder.root.%'
),

record_match AS (
  SELECT
    record.archiveid,
    'record'::TEXT AS item_type,
    record.recordid AS item_id,
    COALESCE(
      TO_TSVECTOR('simple', record.displayname)
      @@ (SELECT search_terms.ts_query FROM search_terms),
      FALSE
    ) AS name_matched,
    COALESCE(
      TO_TSVECTOR('simple', record.description)
      @@ (SELECT search_terms.ts_query FROM search_terms),
      FALSE
    ) AS description_matched
  FROM
    record
  INNER JOIN
    public_archive
    ON record.archiveid = public_archive.archiveid
  WHERE
    (
      TO_TSVECTOR('simple', record.displayname)
      @@ (SELECT search_terms.ts_query FROM search_terms)
      OR TO_TSVECTOR('simple', record.description)
      @@ (SELECT search_terms.ts_query FROM search_terms)
    )
    AND record.publicdt IS NOT NULL
    AND record.publicdt <= CURRENT_TIMESTAMP
    AND record.status != 'status.generic.deleted'
),

-- Only custom metadata tags have a meaningful type: the part of
-- 'type.tag.metadata.<field>' after the prefix is the field name the web app
-- displays. Keyword tags share generic types, so their type is not searched.
tag_candidate AS (
  SELECT
    tag.tagid,
    tag.archiveid,
    tag.name,
    tag.type,
    COALESCE(
      TO_TSVECTOR('simple', tag.name)
      @@ (SELECT search_terms.ts_query FROM search_terms),
      FALSE
    ) AS name_matched,
    COALESCE(
      tag.type LIKE 'type.tag.metadata.%'
      AND TO_TSVECTOR(
        'simple',
        SUBSTRING(tag.type FROM LENGTH('type.tag.metadata.') + 1)
      )
      @@ (SELECT search_terms.ts_query FROM search_terms),
      FALSE
    ) AS type_matched
  FROM
    tag
  INNER JOIN
    public_archive
    ON tag.archiveid = public_archive.archiveid
  WHERE
    tag.status = 'status.generic.ok'
),

tagged_item_match AS (
  SELECT
    tag_candidate.archiveid,
    tag_link.reftable AS item_type,
    tag_link.refid AS item_id,
    tag_candidate.name_matched AS tag_name_matched,
    tag_candidate.type_matched AS tag_type_matched,
    JSONB_BUILD_OBJECT(
      'id', tag_candidate.tagid::TEXT,
      'name', tag_candidate.name,
      'type', tag_candidate.type
    ) AS tag_data
  FROM
    tag_candidate
  INNER JOIN
    tag_link
    ON
      tag_candidate.tagid = tag_link.tagid
      AND tag_link.status = 'status.generic.ok'
  LEFT JOIN
    folder
    ON
      tag_link.reftable = 'folder'
      AND tag_link.refid = folder.folderid
      AND tag_candidate.archiveid = folder.archiveid
      AND folder.publicdt IS NOT NULL
      AND folder.publicdt <= CURRENT_TIMESTAMP
      AND folder.status != 'status.generic.deleted'
      AND folder.type NOT LIKE 'type.folder.root.%'
  LEFT JOIN
    record
    ON
      tag_link.reftable = 'record'
      AND tag_link.refid = record.recordid
      AND tag_candidate.archiveid = record.archiveid
      AND record.publicdt IS NOT NULL
      AND record.publicdt <= CURRENT_TIMESTAMP
      AND record.status != 'status.generic.deleted'
  WHERE
    (tag_candidate.name_matched OR tag_candidate.type_matched)
    AND (folder.folderid IS NOT NULL OR record.recordid IS NOT NULL)
),

item_match_part AS (
  SELECT
    folder_match.archiveid,
    folder_match.item_type,
    folder_match.item_id,
    folder_match.name_matched,
    folder_match.description_matched,
    FALSE AS tag_name_matched,
    FALSE AS tag_type_matched,
    NULL::JSONB AS tag_data
  FROM folder_match
  UNION ALL
  SELECT
    record_match.archiveid,
    record_match.item_type,
    record_match.item_id,
    record_match.name_matched,
    record_match.description_matched,
    FALSE AS tag_name_matched,
    FALSE AS tag_type_matched,
    NULL::JSONB AS tag_data
  FROM record_match
  UNION ALL
  SELECT
    tagged_item_match.archiveid,
    tagged_item_match.item_type,
    tagged_item_match.item_id,
    FALSE AS name_matched,
    FALSE AS description_matched,
    tagged_item_match.tag_name_matched,
    tagged_item_match.tag_type_matched,
    tagged_item_match.tag_data
  FROM tagged_item_match
),

item_match AS (
  SELECT
    item_match_part.archiveid,
    item_match_part.item_type,
    item_match_part.item_id,
    BOOL_OR(item_match_part.name_matched) AS name_matched,
    BOOL_OR(item_match_part.description_matched) AS description_matched,
    BOOL_OR(item_match_part.tag_name_matched) AS tag_name_matched,
    BOOL_OR(item_match_part.tag_type_matched) AS tag_type_matched,
    JSONB_AGG(
      item_match_part.tag_data
      ORDER BY (item_match_part.tag_data ->> 'id')::BIGINT
    ) FILTER (WHERE item_match_part.tag_data IS NOT NULL) AS matched_tags
  FROM item_match_part
  GROUP BY
    item_match_part.archiveid,
    item_match_part.item_type,
    item_match_part.item_id
),

search_match AS (
  SELECT
    archive_name_match.archiveid,
    0 AS match_group,
    1 AS matched_field_count,
    '' AS sort_name,
    '' AS sort_type,
    0::BIGINT AS sort_id,
    JSONB_BUILD_OBJECT('matchType', 'archiveName') AS match_data
  FROM archive_name_match
  UNION ALL
  SELECT
    milestone_match.archiveid,
    1 AS match_group,
    milestone_match.title_matched::INT
    + milestone_match.description_matched::INT AS matched_field_count,
    COALESCE(milestone_match.title, '') AS sort_name,
    '' AS sort_type,
    milestone_match.profile_itemid AS sort_id,
    JSONB_BUILD_OBJECT(
      'matchType', 'milestone',
      'matchedFields', TO_JSONB(ARRAY_REMOVE(ARRAY[
        CASE WHEN milestone_match.title_matched THEN 'title' END,
        CASE WHEN milestone_match.description_matched THEN 'description' END
      ], NULL)),
      'milestone', JSONB_BUILD_OBJECT(
        'id', milestone_match.profile_itemid::TEXT,
        'title', milestone_match.title,
        'description', milestone_match.description,
        'date', milestone_match.day1::TEXT
      )
    ) AS match_data
  FROM milestone_match
  UNION ALL
  SELECT
    item_match.archiveid,
    2 AS match_group,
    item_match.name_matched::INT
    + item_match.description_matched::INT
    + item_match.tag_name_matched::INT
    + item_match.tag_type_matched::INT AS matched_field_count,
    COALESCE(item_record.displayname, item_folder.displayname, '')
      AS sort_name,
    item_match.item_type AS sort_type,
    item_match.item_id AS sort_id,
    JSONB_BUILD_OBJECT(
      'matchType', 'item',
      'matchedFields', TO_JSONB(ARRAY_REMOVE(ARRAY[
        CASE WHEN item_match.name_matched THEN 'name' END,
        CASE WHEN item_match.description_matched THEN 'description' END,
        CASE WHEN item_match.tag_name_matched THEN 'tagName' END,
        CASE WHEN item_match.tag_type_matched THEN 'tagType' END
      ], NULL)),
      'item', JSONB_BUILD_OBJECT(
        'id', item_match.item_id::TEXT,
        'itemType', item_match.item_type,
        'displayName',
        COALESCE(item_record.displayname, item_folder.displayname),
        'displayTime',
        COALESCE(item_record.displaytime, item_folder.displaytime),
        'thumbnailUrls', JSONB_BUILD_OBJECT(
          'width200',
          COALESCE(item_record.thumburl200, item_folder.thumburl200),
          'width256',
          COALESCE(item_record.thumbnail256, item_folder.thumbnail256),
          'width500',
          COALESCE(item_record.thumburl500, item_folder.thumburl500),
          'width1000',
          COALESCE(item_record.thumburl1000, item_folder.thumburl1000),
          'width2000',
          COALESCE(item_record.thumburl2000, item_folder.thumburl2000)
        )
      )
    )
    || CASE
      WHEN item_match.matched_tags IS NULL THEN '{}'::JSONB
      ELSE JSONB_BUILD_OBJECT('matchedTags', item_match.matched_tags)
    END AS match_data
  FROM
    item_match
  LEFT JOIN
    folder AS item_folder
    ON
      item_match.item_type = 'folder'
      AND item_match.item_id = item_folder.folderid
  LEFT JOIN
    record AS item_record
    ON
      item_match.item_type = 'record'
      AND item_match.item_id = item_record.recordid
),

ranked_match AS (
  SELECT
    search_match.archiveid,
    search_match.match_data,
    ROW_NUMBER() OVER (
      PARTITION BY search_match.archiveid
      ORDER BY
        search_match.match_group ASC,
        search_match.matched_field_count DESC,
        search_match.sort_name ASC,
        search_match.sort_type ASC,
        search_match.sort_id ASC
    ) AS match_rank
  FROM search_match
),

archive_result AS (
  SELECT
    ranked_match.archiveid,
    COUNT(*)::INT AS total_match_count,
    BOOL_OR(ranked_match.match_data ->> 'matchType' = 'archiveName')
      AS name_matched,
    JSONB_AGG(ranked_match.match_data ORDER BY ranked_match.match_rank)
      FILTER (WHERE ranked_match.match_rank <= :maxMatchesPerArchive)
      AS matches
  FROM ranked_match
  GROUP BY ranked_match.archiveid
),

ranked_archive AS (
  SELECT
    public_archive.archiveid,
    public_archive.name,
    public_archive.thumburl200,
    public_archive.thumburl500,
    public_archive.thumburl1000,
    public_archive.thumburl2000,
    archive_result.total_match_count,
    archive_result.matches,
    ROW_NUMBER() OVER (
      ORDER BY
        archive_result.name_matched DESC,
        archive_result.total_match_count DESC,
        public_archive.name ASC,
        public_archive.archiveid ASC
    ) AS rank
  FROM
    archive_result
  INNER JOIN
    public_archive
    ON archive_result.archiveid = public_archive.archiveid
),

cursor AS (
  SELECT ranked_archive.rank
  FROM ranked_archive
  WHERE ranked_archive.archiveid = :cursor::BIGINT
),

total_pages AS (
  SELECT CEILING(COUNT(*) / :pageSize::NUMERIC)::INT AS total_pages
  FROM ranked_archive
)

SELECT
  ranked_archive.archiveid::TEXT AS "archiveId",
  JSONB_BUILD_OBJECT(
    'id', ranked_archive.archiveid::TEXT,
    'name', ranked_archive.name,
    'thumbnailUrls', JSONB_BUILD_OBJECT(
      'width200', ranked_archive.thumburl200,
      'width500', ranked_archive.thumburl500,
      'width1000', ranked_archive.thumburl1000,
      'width2000', ranked_archive.thumburl2000
    )
  ) AS archive,
  ranked_archive.total_match_count AS "totalMatchCount",
  ranked_archive.matches,
  (SELECT total_pages.total_pages FROM total_pages) AS "totalPages"
FROM ranked_archive
WHERE
  (:cursor::BIGINT IS NULL OR EXISTS (SELECT 1 FROM cursor))
  AND ranked_archive.rank > COALESCE((SELECT cursor.rank FROM cursor), 0)
ORDER BY ranked_archive.rank ASC
LIMIT :pageSize;
