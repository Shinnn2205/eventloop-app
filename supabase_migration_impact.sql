-- =============================================
-- SUPABASE MIGRATION: Impact Dashboard Tables
-- =============================================

-- 1. Monthly Impact Data (tren bulanan)
CREATE TABLE IF NOT EXISTS monthly_impact (
  id SERIAL PRIMARY KEY,
  month_label TEXT NOT NULL,         -- e.g. 'May', 'Jun'
  year INT NOT NULL DEFAULT 2026,
  items_reused INT NOT NULL DEFAULT 0,
  waste_avoided_kg NUMERIC(10,2) NOT NULL DEFAULT 0,
  cost_avoided INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Organization Scores (leaderboard circular score)
CREATE TABLE IF NOT EXISTS organization_scores (
  id SERIAL PRIMARY KEY,
  org_name TEXT NOT NULL,
  events_count INT NOT NULL DEFAULT 0,
  items_reused INT NOT NULL DEFAULT 0,
  circular_score INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS but allow public read
ALTER TABLE monthly_impact ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_scores ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Allow public read monthly_impact" ON monthly_impact
  FOR SELECT USING (true);

CREATE POLICY "Allow public read organization_scores" ON organization_scores
  FOR SELECT USING (true);

-- Allow authenticated users to insert/update
CREATE POLICY "Allow auth insert monthly_impact" ON monthly_impact
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow auth update monthly_impact" ON monthly_impact
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow auth insert organization_scores" ON organization_scores
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow auth update organization_scores" ON organization_scores
  FOR UPDATE USING (auth.role() = 'authenticated');
