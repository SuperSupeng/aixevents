-- Datawhale AI+X 活动日历：编辑 token RPC 初始化
-- 不删除数据。用于创建 /edit/:token 页面依赖的读取与修改函数。
-- 函数体不使用 dollar-quoted $$，避免 Supabase Dashboard 自动插入 RLS 语句破坏函数体。

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION datawhale_edit_token_hash(p_edit_token TEXT)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
RETURN encode(digest(p_edit_token, 'sha256'), 'hex');

CREATE OR REPLACE FUNCTION get_datawhale_event_by_edit_token(p_edit_token TEXT)
RETURNS JSONB
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
RETURN (
  SELECT jsonb_build_object(
    'id', e.id,
    'title', e.title,
    'summary', e.summary,
    'start_time', e.start_time,
    'end_time', e.end_time,
    'timezone', e.timezone,
    'format', e.format,
    'activity_type', e.activity_type,
    'location', e.location,
    'organizer', e.organizer,
    'organizers', e.organizers,
    'links', e.links,
    'tags', e.tags,
    'custom_tags', e.custom_tags,
    'submitter', e.submitter,
    'notes', e.notes,
    'review_status', e.review_status,
    'review_note', e.review_note,
    'update_status', e.update_status,
    'update_note', e.update_note,
    'pending_update', e.pending_update
  )
  FROM datawhale_events e
  WHERE p_edit_token IS NOT NULL
    AND length(p_edit_token) >= 16
    AND e.edit_token_hash = datawhale_edit_token_hash(p_edit_token)
  LIMIT 1
);

CREATE OR REPLACE FUNCTION update_datawhale_event_by_edit_token(p_edit_token TEXT, p_event JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS '
BEGIN
  IF p_edit_token IS NULL OR length(p_edit_token) < 16 THEN
    RETURN jsonb_build_object(''ok'', false, ''error'', ''invalid_token'');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM datawhale_events e
    WHERE e.edit_token_hash = datawhale_edit_token_hash(p_edit_token)
  ) THEN
    RETURN jsonb_build_object(''ok'', false, ''error'', ''not_found'');
  END IF;

  IF EXISTS (
    SELECT 1
    FROM datawhale_events e
    WHERE e.edit_token_hash = datawhale_edit_token_hash(p_edit_token)
      AND e.review_status = ''approved''
  ) THEN
    UPDATE datawhale_events
    SET
      pending_update = p_event,
      update_status = ''pending'',
      update_note = NULL,
      updated_at = NOW()
    WHERE id = (
      SELECT e.id
      FROM datawhale_events e
      WHERE e.edit_token_hash = datawhale_edit_token_hash(p_edit_token)
        AND e.review_status = ''approved''
      LIMIT 1
    );

    RETURN jsonb_build_object(''ok'', true, ''mode'', ''pending_update'');
  END IF;

  UPDATE datawhale_events
  SET
    title = p_event->>''title'',
    summary = p_event->>''summary'',
    start_time = (p_event->>''start_time'')::TIMESTAMPTZ,
    end_time = (p_event->>''end_time'')::TIMESTAMPTZ,
    timezone = COALESCE(p_event->>''timezone'', ''Asia/Shanghai''),
    format = p_event->>''format'',
    activity_type = COALESCE(p_event->>''activity_type'', ''meetup''),
    location = p_event->''location'',
    organizer = p_event->''organizer'',
    organizers = ARRAY(
      SELECT item_value
      FROM jsonb_array_elements_text(COALESCE(p_event->''organizers'', ''[]''::JSONB)) AS items(item_value)
    ),
    links = p_event->''links'',
    tags = ARRAY(
      SELECT item_value
      FROM jsonb_array_elements_text(COALESCE(p_event->''tags'', ''[]''::JSONB)) AS items(item_value)
    ),
    custom_tags = ARRAY(
      SELECT item_value
      FROM jsonb_array_elements_text(COALESCE(p_event->''custom_tags'', ''[]''::JSONB)) AS items(item_value)
    ),
    submitter = p_event->''submitter'',
    notes = NULLIF(p_event->>''notes'', ''''),
    review_status = ''pending'',
    review_note = NULL,
    reviewed_at = NULL,
    published_at = NULL,
    pending_update = NULL,
    update_status = ''none'',
    update_note = NULL,
    updated_at = NOW()
  WHERE id = (
    SELECT e.id
    FROM datawhale_events e
    WHERE e.edit_token_hash = datawhale_edit_token_hash(p_edit_token)
    LIMIT 1
  );

  RETURN jsonb_build_object(''ok'', true, ''mode'', ''direct_update'');
END;
';

GRANT EXECUTE ON FUNCTION get_datawhale_event_by_edit_token(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_datawhale_event_by_edit_token(TEXT, JSONB) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';

SELECT
  to_regprocedure('public.get_datawhale_event_by_edit_token(text)') AS get_function,
  to_regprocedure('public.update_datawhale_event_by_edit_token(text,jsonb)') AS update_function;
