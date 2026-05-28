-- Datawhale AI+X 活动日历 RLS 与 Storage 策略修复脚本
-- 完整初始化优先执行 database/schema.sql；此文件用于只重建权限策略。

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

SELECT 'Datawhale AI+X RLS setup completed' AS status;
