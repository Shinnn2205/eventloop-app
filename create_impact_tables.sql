-- ====================================================================
-- SQL MIGRATION: Tabel Impact Dashboard & Circular Impact di Supabase
-- Jalankan query ini di Dashboard Supabase -> SQL Editor -> Klik "Run"
-- ====================================================================

-- 1. Tabel campus_impact: Menyimpan metrik agregat kampus
CREATE TABLE IF NOT EXISTS public.campus_impact (
  id SERIAL PRIMARY KEY,
  items_reused INT NOT NULL DEFAULT 0,
  waste_avoided_kg NUMERIC(10,2) NOT NULL DEFAULT 0,
  cost_avoided BIGINT NOT NULL DEFAULT 0,
  events_supported INT NOT NULL DEFAULT 0,
  circular_score INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aktifkan RLS dan beri izin SELECT & UPDATE ke public/anon
ALTER TABLE public.campus_impact ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read campus_impact" ON public.campus_impact
  FOR SELECT USING (true);

CREATE POLICY "Allow anon update campus_impact" ON public.campus_impact
  FOR UPDATE USING (true);

CREATE POLICY "Allow anon insert campus_impact" ON public.campus_impact
  FOR INSERT WITH CHECK (true);

-- Masukkan 1 baris data awal (bisa diubah-ubah kapan saja lewat Supabase Table Editor)
INSERT INTO public.campus_impact (id, items_reused, waste_avoided_kg, cost_avoided, events_supported, circular_score)
VALUES (1, 0, 0, 0, 0, 0)
ON CONFLICT (id) DO NOTHING;

-- 2. Tabel organization_impact: Menyimpan skor dampak per organisasi
CREATE TABLE IF NOT EXISTS public.organization_impact (
  id SERIAL PRIMARY KEY,
  org_name TEXT NOT NULL,
  events_count INT NOT NULL DEFAULT 0,
  items_reused INT NOT NULL DEFAULT 0,
  circular_score INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.organization_impact ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read organization_impact" ON public.organization_impact
  FOR SELECT USING (true);

CREATE POLICY "Allow anon all organization_impact" ON public.organization_impact
  FOR ALL USING (true);
