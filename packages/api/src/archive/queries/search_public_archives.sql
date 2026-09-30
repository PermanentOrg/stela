-- Search public archives, and the public content inside them, for the words
-- of :query. The text search parser splits :query into words; each word is
-- quoted and escaped before it becomes a prefix query, so operators and
-- punctuation in :query have no special meaning. A field matches a word when
-- one of its words starts with that word, or, for record and folder names,
-- when it contains a close misspelling of it (pg_trgm word similarity). A
-- match only needs one query word; matches with more words rank first.
-- Comparisons use the 'simple' configuration so that they match the existing
-- full-text indexes on folder, record and profile_item.
WITH query_word AS MATERIALIZED (
  SELECT
    parsed_word.lexeme AS word,
    parsed_word.positions[1] AS word_position
  FROM
    UNNEST(TO_TSVECTOR('simple', :query)) AS parsed_word
),

-- Words shorter than :minimumWordLength are dropped, unless every word is
-- that short.
search_word AS MATERIALIZED (
  SELECT
    query_word.word,
    query_word.word_position,
    TO_TSQUERY(
      'simple',
      ''''
      || REPLACE(
        REPLACE(query_word.word, CHR(92), CHR(92) || CHR(92)), '''', ''''''
      )
      || ''':*'
    ) AS word_query
  FROM query_word
  WHERE
    LENGTH(query_word.word) >= :minimumWordLength
    OR NOT EXISTS (
      SELECT 1
      FROM query_word AS long_word
      WHERE LENGTH(long_word.word) >= :minimumWordLength
    )
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

-- The public_* sets below are inlined wherever they are used, so that the
-- planner can still use the text and trigram indexes on the base tables.
public_milestone AS NOT MATERIALIZED (
  SELECT
    milestone.archiveid,
    milestone.profile_itemid,
    milestone.string1 AS title,
    milestone.string2 AS description
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

public_folder AS NOT MATERIALIZED (
  SELECT
    folder.archiveid,
    folder.folderid,
    folder.displayname,
    folder.description
  FROM
    folder
  INNER JOIN
    public_archive
    ON folder.archiveid = public_archive.archiveid
  WHERE
    folder.publicdt IS NOT NULL
    AND folder.publicdt <= CURRENT_TIMESTAMP
    AND folder.status != 'status.generic.deleted'
    AND folder.type NOT LIKE 'type.folder.root.%'
),

public_record AS NOT MATERIALIZED (
  SELECT
    record.archiveid,
    record.recordid,
    record.displayname,
    record.description
  FROM
    record
  INNER JOIN
    public_archive
    ON record.archiveid = public_archive.archiveid
  WHERE
    record.publicdt IS NOT NULL
    AND record.publicdt <= CURRENT_TIMESTAMP
    AND record.status != 'status.generic.deleted'
),

-- Only custom metadata tags have a meaningful type: the part of
-- 'type.tag.metadata.<field>' after the prefix is the field name the web app
-- displays. Keyword tags share generic types, so their type is not searched.
matching_tag AS (
  SELECT
    tag.tagid,
    tag.archiveid,
    'tagName'::TEXT AS field,
    search_word.word,
    search_word.word_position
  FROM
    tag
  INNER JOIN
    public_archive
    ON tag.archiveid = public_archive.archiveid
  INNER JOIN
    search_word
    ON TO_TSVECTOR('simple', tag.name) @@ search_word.word_query
  WHERE
    tag.status = 'status.generic.ok'
  UNION ALL
  SELECT
    tag.tagid,
    tag.archiveid,
    'tagType'::TEXT AS field,
    search_word.word,
    search_word.word_position
  FROM
    tag
  INNER JOIN
    public_archive
    ON tag.archiveid = public_archive.archiveid
  INNER JOIN
    search_word
    ON
      tag.type LIKE 'type.tag.metadata.%'
      AND TO_TSVECTOR(
        'simple',
        SUBSTRING(tag.type FROM LENGTH('type.tag.metadata.') + 1)
      )
      @@ search_word.word_query
  WHERE
    tag.status = 'status.generic.ok'
),

-- One row per matched field and query word. exact is FALSE for typo matches.
search_hit AS (
  SELECT
    public_archive.archiveid,
    'archiveName'::TEXT AS match_kind,
    public_archive.archiveid AS match_id,
    'name'::TEXT AS field,
    search_word.word,
    search_word.word_position,
    TRUE AS exact,
    NULL::BIGINT AS tag_id
  FROM
    public_archive
  INNER JOIN
    search_word
    ON TO_TSVECTOR('simple', public_archive.name) @@ search_word.word_query
  UNION ALL
  SELECT
    public_milestone.archiveid,
    'milestone'::TEXT AS match_kind,
    public_milestone.profile_itemid AS match_id,
    'title'::TEXT AS field,
    search_word.word,
    search_word.word_position,
    TRUE AS exact,
    NULL::BIGINT AS tag_id
  FROM
    public_milestone
  INNER JOIN
    search_word
    ON TO_TSVECTOR('simple', public_milestone.title) @@ search_word.word_query
  UNION ALL
  SELECT
    public_milestone.archiveid,
    'milestone'::TEXT AS match_kind,
    public_milestone.profile_itemid AS match_id,
    'description'::TEXT AS field,
    search_word.word,
    search_word.word_position,
    TRUE AS exact,
    NULL::BIGINT AS tag_id
  FROM
    public_milestone
  INNER JOIN
    search_word
    ON
      TO_TSVECTOR('simple', public_milestone.description)
      @@ search_word.word_query
  UNION ALL
  SELECT
    public_folder.archiveid,
    'folder'::TEXT AS match_kind,
    public_folder.folderid AS match_id,
    'name'::TEXT AS field,
    search_word.word,
    search_word.word_position,
    TRUE AS exact,
    NULL::BIGINT AS tag_id
  FROM
    search_word
  INNER JOIN
    public_folder
    ON
      TO_TSVECTOR('simple', public_folder.displayname)
      @@ search_word.word_query
  UNION ALL
  SELECT
    public_folder.archiveid,
    'folder'::TEXT AS match_kind,
    public_folder.folderid AS match_id,
    'name'::TEXT AS field,
    search_word.word,
    search_word.word_position,
    FALSE AS exact,
    NULL::BIGINT AS tag_id
  FROM
    search_word
  INNER JOIN
    public_folder
    ON search_word.word <% public_folder.displayname
  UNION ALL
  SELECT
    public_folder.archiveid,
    'folder'::TEXT AS match_kind,
    public_folder.folderid AS match_id,
    'description'::TEXT AS field,
    search_word.word,
    search_word.word_position,
    TRUE AS exact,
    NULL::BIGINT AS tag_id
  FROM
    search_word
  INNER JOIN
    public_folder
    ON
      TO_TSVECTOR('simple', public_folder.description)
      @@ search_word.word_query
  UNION ALL
  SELECT
    public_record.archiveid,
    'record'::TEXT AS match_kind,
    public_record.recordid AS match_id,
    'name'::TEXT AS field,
    search_word.word,
    search_word.word_position,
    TRUE AS exact,
    NULL::BIGINT AS tag_id
  FROM
    search_word
  INNER JOIN
    public_record
    ON
      TO_TSVECTOR('simple', public_record.displayname)
      @@ search_word.word_query
  UNION ALL
  SELECT
    public_record.archiveid,
    'record'::TEXT AS match_kind,
    public_record.recordid AS match_id,
    'name'::TEXT AS field,
    search_word.word,
    search_word.word_position,
    FALSE AS exact,
    NULL::BIGINT AS tag_id
  FROM
    search_word
  INNER JOIN
    public_record
    ON search_word.word <% public_record.displayname
  UNION ALL
  SELECT
    public_record.archiveid,
    'record'::TEXT AS match_kind,
    public_record.recordid AS match_id,
    'description'::TEXT AS field,
    search_word.word,
    search_word.word_position,
    TRUE AS exact,
    NULL::BIGINT AS tag_id
  FROM
    search_word
  INNER JOIN
    public_record
    ON
      TO_TSVECTOR('simple', public_record.description)
      @@ search_word.word_query
  UNION ALL
  SELECT
    matching_tag.archiveid,
    tag_link.reftable::TEXT AS match_kind,
    tag_link.refid AS match_id,
    matching_tag.field,
    matching_tag.word,
    matching_tag.word_position,
    TRUE AS exact,
    matching_tag.tagid AS tag_id
  FROM
    matching_tag
  INNER JOIN
    tag_link
    ON
      matching_tag.tagid = tag_link.tagid
      AND tag_link.status = 'status.generic.ok'
  LEFT JOIN
    public_folder
    ON
      tag_link.reftable = 'folder'
      AND tag_link.refid = public_folder.folderid
      AND matching_tag.archiveid = public_folder.archiveid
  LEFT JOIN
    public_record
    ON
      tag_link.reftable = 'record'
      AND tag_link.refid = public_record.recordid
      AND matching_tag.archiveid = public_record.archiveid
  WHERE
    public_folder.folderid IS NOT NULL
    OR public_record.recordid IS NOT NULL
),

word_hit AS (
  SELECT
    search_hit.archiveid,
    search_hit.match_kind,
    search_hit.match_id,
    search_hit.word,
    search_hit.word_position,
    BOOL_OR(search_hit.exact) AS exact
  FROM search_hit
  GROUP BY
    search_hit.archiveid,
    search_hit.match_kind,
    search_hit.match_id,
    search_hit.word,
    search_hit.word_position
),

word_summary AS (
  SELECT
    word_hit.archiveid,
    word_hit.match_kind,
    word_hit.match_id,
    ARRAY_AGG(word_hit.word ORDER BY word_hit.word_position) AS matched_words,
    COUNT(*)::INT AS matched_word_count,
    (COUNT(*) FILTER (WHERE word_hit.exact))::INT AS exact_word_count
  FROM word_hit
  GROUP BY
    word_hit.archiveid,
    word_hit.match_kind,
    word_hit.match_id
),

field_summary AS (
  SELECT
    search_hit.archiveid,
    search_hit.match_kind,
    search_hit.match_id,
    BOOL_OR(search_hit.field = 'name') AS name_matched,
    BOOL_OR(search_hit.field = 'title') AS title_matched,
    BOOL_OR(search_hit.field = 'description') AS description_matched,
    BOOL_OR(search_hit.field = 'tagName') AS tag_name_matched,
    BOOL_OR(search_hit.field = 'tagType') AS tag_type_matched
  FROM search_hit
  GROUP BY
    search_hit.archiveid,
    search_hit.match_kind,
    search_hit.match_id
),

matched_tag AS (
  SELECT DISTINCT
    search_hit.archiveid,
    search_hit.match_kind,
    search_hit.match_id,
    search_hit.tag_id
  FROM search_hit
  WHERE search_hit.tag_id IS NOT NULL
),

tag_summary AS (
  SELECT
    matched_tag.archiveid,
    matched_tag.match_kind,
    matched_tag.match_id,
    JSONB_AGG(
      JSONB_BUILD_OBJECT(
        'id', tag.tagid::TEXT,
        'name', tag.name,
        'type', tag.type
      )
      ORDER BY tag.tagid
    ) AS matched_tags
  FROM
    matched_tag
  INNER JOIN
    tag
    ON matched_tag.tag_id = tag.tagid
  GROUP BY
    matched_tag.archiveid,
    matched_tag.match_kind,
    matched_tag.match_id
),

match_summary AS (
  SELECT
    word_summary.archiveid,
    word_summary.match_kind,
    word_summary.match_id,
    word_summary.matched_words,
    word_summary.matched_word_count,
    word_summary.exact_word_count,
    field_summary.name_matched,
    field_summary.title_matched,
    field_summary.description_matched,
    field_summary.tag_name_matched,
    field_summary.tag_type_matched,
    field_summary.name_matched::INT
    + field_summary.title_matched::INT
    + field_summary.description_matched::INT
    + field_summary.tag_name_matched::INT
    + field_summary.tag_type_matched::INT AS matched_field_count,
    tag_summary.matched_tags
  FROM
    word_summary
  INNER JOIN
    field_summary
    ON
      word_summary.archiveid = field_summary.archiveid
      AND word_summary.match_kind = field_summary.match_kind
      AND word_summary.match_id = field_summary.match_id
  LEFT JOIN
    tag_summary
    ON
      word_summary.archiveid = tag_summary.archiveid
      AND word_summary.match_kind = tag_summary.match_kind
      AND word_summary.match_id = tag_summary.match_id
),

search_match AS (
  SELECT
    match_summary.archiveid,
    match_summary.matched_word_count,
    match_summary.exact_word_count,
    match_summary.matched_field_count,
    CASE match_summary.match_kind
      WHEN 'archiveName' THEN 0
      WHEN 'milestone' THEN 1
      ELSE 2
    END AS match_group,
    COALESCE(
      milestone.string1, item_record.displayname, item_folder.displayname, ''
    ) AS sort_name,
    match_summary.match_kind AS sort_type,
    match_summary.match_id AS sort_id,
    CASE match_summary.match_kind
      WHEN 'archiveName'
        THEN
          JSONB_BUILD_OBJECT(
            'matchType', 'archiveName',
            'matchedWords', TO_JSONB(match_summary.matched_words)
          )
      WHEN 'milestone'
        THEN
          JSONB_BUILD_OBJECT(
            'matchType', 'milestone',
            'matchedFields', TO_JSONB(ARRAY_REMOVE(ARRAY[
              CASE WHEN match_summary.title_matched THEN 'title' END,
              CASE
                WHEN match_summary.description_matched THEN 'description'
              END
            ], NULL)),
            'matchedWords', TO_JSONB(match_summary.matched_words),
            'milestone', JSONB_BUILD_OBJECT(
              'id', milestone.profile_itemid::TEXT,
              'title', milestone.string1,
              'description', milestone.string2,
              'date', milestone.day1::TEXT
            )
          )
      ELSE
        JSONB_BUILD_OBJECT(
          'matchType', 'item',
          'matchedFields', TO_JSONB(ARRAY_REMOVE(ARRAY[
            CASE WHEN match_summary.name_matched THEN 'name' END,
            CASE
              WHEN match_summary.description_matched THEN 'description'
            END,
            CASE WHEN match_summary.tag_name_matched THEN 'tagName' END,
            CASE WHEN match_summary.tag_type_matched THEN 'tagType' END
          ], NULL)),
          'matchedWords', TO_JSONB(match_summary.matched_words),
          'item', JSONB_BUILD_OBJECT(
            'id', match_summary.match_id::TEXT,
            'itemType', match_summary.match_kind,
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
          WHEN match_summary.matched_tags IS NULL THEN '{}'::JSONB
          ELSE JSONB_BUILD_OBJECT('matchedTags', match_summary.matched_tags)
        END
    END AS match_data
  FROM
    match_summary
  LEFT JOIN
    profile_item AS milestone
    ON
      match_summary.match_kind = 'milestone'
      AND match_summary.match_id = milestone.profile_itemid
  LEFT JOIN
    folder AS item_folder
    ON
      match_summary.match_kind = 'folder'
      AND match_summary.match_id = item_folder.folderid
  LEFT JOIN
    record AS item_record
    ON
      match_summary.match_kind = 'record'
      AND match_summary.match_id = item_record.recordid
),

ranked_match AS (
  SELECT
    search_match.archiveid,
    search_match.match_data,
    search_match.match_group,
    search_match.matched_word_count,
    ROW_NUMBER() OVER (
      PARTITION BY search_match.archiveid
      ORDER BY
        search_match.matched_word_count DESC,
        search_match.exact_word_count DESC,
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
    MAX(ranked_match.matched_word_count) AS best_word_count,
    BOOL_OR(ranked_match.match_group = 0) AS name_matched,
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
        archive_result.best_word_count DESC,
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
