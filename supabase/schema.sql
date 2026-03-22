-- ===== PROFILES =====
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, display_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'viewer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ===== BRANDS =====
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo TEXT NOT NULL DEFAULT '🏷️',
  color TEXT NOT NULL DEFAULT '#6366f1',
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===== CAMPAIGNS =====
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('big-campaign', 'flash-sale', 'social', 'email', 'event', 'content')),
  brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  key_message TEXT DEFAULT '',
  budget TEXT DEFAULT '',
  channels TEXT[] DEFAULT '{}',
  target_audience TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  details TEXT DEFAULT '',
  media TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS campaigns_updated_at ON campaigns;
CREATE TRIGGER campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ===== MILESTONES =====
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  date DATE NOT NULL,
  completed BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_milestones_campaign ON milestones(campaign_id);

-- ===== CHANGELOG =====
CREATE TABLE IF NOT EXISTS changelog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  username TEXT NOT NULL,
  user_role TEXT NOT NULL,
  action TEXT NOT NULL,
  action_label TEXT NOT NULL,
  target_name TEXT DEFAULT '',
  details JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_changelog_created ON changelog(created_at DESC);

-- FIFO 500 rows
CREATE OR REPLACE FUNCTION trim_changelog()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM changelog
  WHERE id NOT IN (
    SELECT id FROM changelog ORDER BY created_at DESC LIMIT 500
  );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS changelog_trim ON changelog;
CREATE TRIGGER changelog_trim
  AFTER INSERT ON changelog
  FOR EACH STATEMENT EXECUTE FUNCTION trim_changelog();

-- ===== RLS =====
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE changelog ENABLE ROW LEVEL SECURITY;

-- Helper function
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ===== DROP OLD POLICIES (safe re-run) =====
DROP POLICY IF EXISTS profiles_select ON profiles;
DROP POLICY IF EXISTS profiles_update_self ON profiles;
DROP POLICY IF EXISTS profiles_admin_all ON profiles;
DROP POLICY IF EXISTS profiles_admin_update ON profiles;
DROP POLICY IF EXISTS profiles_admin_delete ON profiles;

DROP POLICY IF EXISTS brands_select ON brands;
DROP POLICY IF EXISTS brands_admin_insert ON brands;
DROP POLICY IF EXISTS brands_admin_update ON brands;
DROP POLICY IF EXISTS brands_admin_delete ON brands;

DROP POLICY IF EXISTS campaigns_select ON campaigns;
DROP POLICY IF EXISTS campaigns_insert ON campaigns;
DROP POLICY IF EXISTS campaigns_update ON campaigns;
DROP POLICY IF EXISTS campaigns_delete ON campaigns;

DROP POLICY IF EXISTS milestones_select ON milestones;
DROP POLICY IF EXISTS milestones_insert ON milestones;
DROP POLICY IF EXISTS milestones_update ON milestones;
DROP POLICY IF EXISTS milestones_delete ON milestones;

DROP POLICY IF EXISTS changelog_select ON changelog;
DROP POLICY IF EXISTS changelog_insert ON changelog;
DROP POLICY IF EXISTS changelog_delete ON changelog;

-- ===== CREATE POLICIES =====

-- PROFILES: everyone reads, self updates, admin manages all
CREATE POLICY profiles_select ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY profiles_update_self ON profiles FOR UPDATE TO authenticated USING (id = auth.uid() OR get_user_role() = 'admin');
CREATE POLICY profiles_admin_delete ON profiles FOR DELETE TO authenticated USING (get_user_role() = 'admin' AND id != auth.uid());

-- BRANDS: everyone reads, admin manages
CREATE POLICY brands_select ON brands FOR SELECT TO authenticated USING (true);
CREATE POLICY brands_admin_insert ON brands FOR INSERT TO authenticated WITH CHECK (get_user_role() = 'admin');
CREATE POLICY brands_admin_update ON brands FOR UPDATE TO authenticated USING (get_user_role() = 'admin');
CREATE POLICY brands_admin_delete ON brands FOR DELETE TO authenticated USING (get_user_role() = 'admin');

-- CAMPAIGNS: everyone reads, admin+editor create/edit, admin deletes
CREATE POLICY campaigns_select ON campaigns FOR SELECT TO authenticated USING (true);
CREATE POLICY campaigns_insert ON campaigns FOR INSERT TO authenticated WITH CHECK (get_user_role() IN ('admin', 'editor'));
CREATE POLICY campaigns_update ON campaigns FOR UPDATE TO authenticated USING (get_user_role() IN ('admin', 'editor'));
CREATE POLICY campaigns_delete ON campaigns FOR DELETE TO authenticated USING (get_user_role() = 'admin');

-- MILESTONES: same as campaigns
CREATE POLICY milestones_select ON milestones FOR SELECT TO authenticated USING (true);
CREATE POLICY milestones_insert ON milestones FOR INSERT TO authenticated WITH CHECK (get_user_role() IN ('admin', 'editor'));
CREATE POLICY milestones_update ON milestones FOR UPDATE TO authenticated USING (get_user_role() IN ('admin', 'editor'));
CREATE POLICY milestones_delete ON milestones FOR DELETE TO authenticated USING (get_user_role() IN ('admin', 'editor'));

-- CHANGELOG: everyone reads, admin+editor insert, admin deletes
CREATE POLICY changelog_select ON changelog FOR SELECT TO authenticated USING (true);
CREATE POLICY changelog_insert ON changelog FOR INSERT TO authenticated WITH CHECK (get_user_role() IN ('admin', 'editor'));
CREATE POLICY changelog_delete ON changelog FOR DELETE TO authenticated USING (get_user_role() = 'admin');

-- ===== ENABLE REALTIME =====
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE campaigns;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE brands;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE milestones;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE changelog;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
