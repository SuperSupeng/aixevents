-- Datawhale AI+X 活动日历数据库架构
-- 可重复执行；不会删除旧 AIXEvents 的 events 表。本站公开读取 datawhale_events_public。

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS datawhale_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Asia/Shanghai',
  is_all_day BOOLEAN DEFAULT false,
  format TEXT NOT NULL CHECK (format IN ('online', 'offline', 'hybrid')),
  activity_type TEXT NOT NULL DEFAULT 'meetup',
  location JSONB,
  organizer JSONB NOT NULL,
  organizers TEXT[] DEFAULT '{}',
  links JSONB NOT NULL,
  tags TEXT[] DEFAULT '{AI+X}',
  custom_tags TEXT[] DEFAULT '{}',
  language TEXT[] DEFAULT '{中文}',
  price JSONB DEFAULT '{"type": "unknown"}',
  submitter JSONB NOT NULL,
  notes TEXT,
  edit_token_hash TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  featured_rank INTEGER,
  pending_update JSONB,
  update_status TEXT NOT NULL DEFAULT 'none' CHECK (update_status IN ('none', 'pending', 'rejected')),
  update_note TEXT,
  review_status TEXT NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected')),
  review_note TEXT,
  reviewed_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE datawhale_events ADD COLUMN IF NOT EXISTS activity_type TEXT NOT NULL DEFAULT 'meetup';
ALTER TABLE datawhale_events ADD COLUMN IF NOT EXISTS organizers TEXT[] DEFAULT '{}';
ALTER TABLE datawhale_events ADD COLUMN IF NOT EXISTS custom_tags TEXT[] DEFAULT '{}';
ALTER TABLE datawhale_events ADD COLUMN IF NOT EXISTS edit_token_hash TEXT;
ALTER TABLE datawhale_events ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE datawhale_events ADD COLUMN IF NOT EXISTS featured_rank INTEGER;
ALTER TABLE datawhale_events ADD COLUMN IF NOT EXISTS pending_update JSONB;
ALTER TABLE datawhale_events ADD COLUMN IF NOT EXISTS update_status TEXT NOT NULL DEFAULT 'none';
ALTER TABLE datawhale_events ADD COLUMN IF NOT EXISTS update_note TEXT;

ALTER TABLE datawhale_events ALTER COLUMN activity_type SET DEFAULT 'meetup';
ALTER TABLE datawhale_events ALTER COLUMN timezone SET DEFAULT 'Asia/Shanghai';
ALTER TABLE datawhale_events ALTER COLUMN review_status SET DEFAULT 'pending';
ALTER TABLE datawhale_events ALTER COLUMN update_status SET DEFAULT 'none';
ALTER TABLE datawhale_events ALTER COLUMN is_featured SET DEFAULT false;

COMMENT ON COLUMN datawhale_events.is_featured IS '是否展示在首页本周推荐；首页最多取 3 个';
COMMENT ON COLUMN datawhale_events.featured_rank IS '推荐排序，数字越小越靠前；相同排序按活动开始时间';
COMMENT ON COLUMN datawhale_events.edit_token_hash IS '提交成功后用于无账号编辑的 token 哈希；不要存明文 token';
COMMENT ON COLUMN datawhale_events.pending_update IS '已公开活动的待确认修改内容；确认通过前不影响公开展示';

CREATE INDEX IF NOT EXISTS idx_datawhale_events_review_status ON datawhale_events(review_status);
CREATE INDEX IF NOT EXISTS idx_datawhale_events_start_time ON datawhale_events(start_time);
CREATE INDEX IF NOT EXISTS idx_datawhale_events_format ON datawhale_events(format);
CREATE INDEX IF NOT EXISTS idx_datawhale_events_activity_type ON datawhale_events(activity_type);
CREATE INDEX IF NOT EXISTS idx_datawhale_events_location_city ON datawhale_events((location->>'city'));
CREATE INDEX IF NOT EXISTS idx_datawhale_events_featured ON datawhale_events(is_featured, featured_rank);
CREATE INDEX IF NOT EXISTS idx_datawhale_events_edit_token_hash ON datawhale_events(edit_token_hash);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS '
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
';

DROP TRIGGER IF EXISTS update_datawhale_events_updated_at ON datawhale_events;
CREATE TRIGGER update_datawhale_events_updated_at
BEFORE UPDATE ON datawhale_events
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP VIEW IF EXISTS datawhale_events_public;

CREATE VIEW datawhale_events_public AS
SELECT
  id,
  title,
  summary,
  links->>'poster' AS cover_image,
  start_time,
  end_time,
  timezone,
  is_all_day,
  format,
  location,
  organizer,
  links,
  tags,
  language,
  price,
  published_at,
  created_at,
  updated_at,
  is_featured,
  featured_rank,
  activity_type,
  organizers,
  custom_tags,
  (CASE
    WHEN end_time < NOW() THEN 'ended'
    WHEN start_time <= NOW() THEN 'live'
    ELSE 'upcoming'
  END) AS status
FROM datawhale_events
WHERE review_status = 'approved';

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
DECLARE
  selected_event datawhale_events%ROWTYPE;
  token_hash_value TEXT;
  payload_organizers TEXT[];
  payload_tags TEXT[];
  payload_custom_tags TEXT[];
BEGIN
  IF p_edit_token IS NULL OR length(p_edit_token) < 16 THEN
    RETURN jsonb_build_object(''ok'', false, ''error'', ''invalid_token'');
  END IF;

  token_hash_value := datawhale_edit_token_hash(p_edit_token);

  SELECT *
  INTO selected_event
  FROM datawhale_events
  WHERE edit_token_hash = token_hash_value
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(''ok'', false, ''error'', ''not_found'');
  END IF;

  SELECT COALESCE(array_agg(item_value), ARRAY[]::TEXT[])
  INTO payload_organizers
  FROM jsonb_array_elements_text(COALESCE(p_event->''organizers'', ''[]''::JSONB)) AS item_value;

  SELECT COALESCE(array_agg(item_value), ARRAY[]::TEXT[])
  INTO payload_tags
  FROM jsonb_array_elements_text(COALESCE(p_event->''tags'', ''[]''::JSONB)) AS item_value;

  SELECT COALESCE(array_agg(item_value), ARRAY[]::TEXT[])
  INTO payload_custom_tags
  FROM jsonb_array_elements_text(COALESCE(p_event->''custom_tags'', ''[]''::JSONB)) AS item_value;

  IF selected_event.review_status = ''approved'' THEN
    UPDATE datawhale_events
    SET
      pending_update = p_event,
      update_status = ''pending'',
      update_note = NULL,
      updated_at = NOW()
    WHERE id = selected_event.id;

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
    organizers = payload_organizers,
    links = p_event->''links'',
    tags = payload_tags,
    custom_tags = payload_custom_tags,
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
  WHERE id = selected_event.id;

  RETURN jsonb_build_object(''ok'', true, ''mode'', ''direct_update'');
END;
';

ALTER TABLE datawhale_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public insert pending Datawhale events" ON datawhale_events;
DROP POLICY IF EXISTS "Deny public read Datawhale events" ON datawhale_events;
DROP POLICY IF EXISTS "Deny public update Datawhale events" ON datawhale_events;
DROP POLICY IF EXISTS "Deny public delete Datawhale events" ON datawhale_events;

REVOKE ALL ON datawhale_events FROM anon, authenticated;
GRANT INSERT ON datawhale_events TO anon, authenticated;
GRANT SELECT ON datawhale_events_public TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_datawhale_event_by_edit_token(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_datawhale_event_by_edit_token(TEXT, JSONB) TO anon, authenticated;

CREATE POLICY "Public insert pending Datawhale events"
ON datawhale_events
FOR INSERT
WITH CHECK (
  review_status = 'pending'
  AND reviewed_at IS NULL
  AND published_at IS NULL
  AND review_note IS NULL
  AND pending_update IS NULL
  AND update_status = 'none'
  AND update_note IS NULL
  AND is_featured = false
  AND featured_rank IS NULL
  AND edit_token_hash IS NOT NULL
);

CREATE POLICY "Deny public read Datawhale events"
ON datawhale_events
FOR SELECT
USING (false);

CREATE POLICY "Deny public update Datawhale events"
ON datawhale_events
FOR UPDATE
USING (false);

CREATE POLICY "Deny public delete Datawhale events"
ON datawhale_events
FOR DELETE
USING (false);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'datawhale-event-posters',
  'datawhale-event-posters',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read Datawhale event posters" ON storage.objects;
DROP POLICY IF EXISTS "Public upload Datawhale event posters" ON storage.objects;

CREATE POLICY "Public read Datawhale event posters"
ON storage.objects
FOR SELECT
USING (bucket_id = 'datawhale-event-posters');

CREATE POLICY "Public upload Datawhale event posters"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'datawhale-event-posters'
  AND (storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp')
);

NOTIFY pgrst, 'reload schema';
