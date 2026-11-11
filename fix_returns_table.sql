-- ====================================================================
-- SQL FIX: Menyelaraskan Tabel returns di Supabase
-- Jalankan query ini di Dashboard Supabase -> SQL Editor -> Klik "Run"
-- ====================================================================

-- 1. Pastikan tabel returns ada dengan tipe data yang fleksibel
CREATE TABLE IF NOT EXISTS public.returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id TEXT,
  condition_photo TEXT,
  storage_photo TEXT,
  status TEXT DEFAULT 'Pending Admin Verification',
  returned_qty INT DEFAULT 1,
  borrower TEXT,
  return_location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ubah equipment_id ke TEXT jika sebelumnya UUID agar kompatibel dengan ID angka maupun UUID
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'returns' AND column_name = 'equipment_id' AND data_type != 'text'
  ) THEN
    ALTER TABLE public.returns ALTER COLUMN equipment_id TYPE text USING equipment_id::text;
  END IF;
END $$;

-- 2. Aktifkan Row Level Security (RLS) dan beri izin penuh ke anon & public
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read returns" ON public.returns;
CREATE POLICY "Allow public read returns" ON public.returns FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anon insert returns" ON public.returns;
CREATE POLICY "Allow anon insert returns" ON public.returns FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update returns" ON public.returns;
CREATE POLICY "Allow anon update returns" ON public.returns FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow anon delete returns" ON public.returns;
CREATE POLICY "Allow anon delete returns" ON public.returns FOR DELETE USING (true);

-- 3. Pastikan tabel equipments mengizinkan insert, update, dan delete untuk public & anon
ALTER TABLE public.equipments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read equipments" ON public.equipments;
CREATE POLICY "Allow public read equipments" ON public.equipments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anon insert equipments" ON public.equipments;
CREATE POLICY "Allow anon insert equipments" ON public.equipments FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update equipments" ON public.equipments;
CREATE POLICY "Allow anon update equipments" ON public.equipments FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow anon delete equipments" ON public.equipments;
CREATE POLICY "Allow anon delete equipments" ON public.equipments FOR DELETE USING (true);
