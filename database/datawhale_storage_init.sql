-- Datawhale AI+X 活动日历：活动海报 Storage 初始化
-- 在 Supabase SQL Editor 中单独执行即可。

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

SELECT 'Datawhale poster storage initialized' AS status;
