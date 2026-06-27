-- ePharma App — Initial Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- Order matters: referenced tables must exist before foreign keys

-- ─────────────────────────────────────────────
-- REGIONS
-- ─────────────────────────────────────────────
CREATE TABLE regions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  currency_code TEXT NOT NULL,
  currency_symbol TEXT NOT NULL,
  locale        TEXT NOT NULL,
  tax_rate      NUMERIC(5,4) NOT NULL DEFAULT 0,
  tax_label     TEXT NOT NULL DEFAULT 'Tax',
  rtl           BOOLEAN NOT NULL DEFAULT false,
  active        BOOLEAN NOT NULL DEFAULT true
);

INSERT INTO regions (code, name, currency_code, currency_symbol, locale, tax_rate, tax_label, rtl) VALUES
  ('US', 'United States',           'USD', '$',    'en-US', 0.00, 'Sales Tax', false),
  ('IN', 'India',                   'INR', '₹',    'en-IN', 0.12, 'GST',       false),
  ('GB', 'United Kingdom',          'GBP', '£',    'en-GB', 0.00, 'VAT',       false),
  ('AE', 'UAE (Dubai / Abu Dhabi)', 'AED', 'د.إ',  'ar-AE', 0.05, 'VAT',       true),
  ('BH', 'Bahrain',                 'BHD', '.د.ب', 'ar-BH', 0.05, 'VAT',       true),
  ('SG', 'Singapore',               'SGD', 'S$',   'en-SG', 0.09, 'GST',       false),
  ('MY', 'Malaysia',                'MYR', 'RM',   'en-MY', 0.06, 'SST',       false);

-- ─────────────────────────────────────────────
-- PROFILES (extends auth.users)
-- ─────────────────────────────────────────────
CREATE TABLE profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name         TEXT,
  phone             TEXT,
  dob               DATE,
  region_id         UUID REFERENCES regions,
  preferred_currency TEXT,
  role              TEXT NOT NULL DEFAULT 'customer'
                    CHECK (role IN ('customer', 'pharmacist', 'admin')),
  expo_push_token   TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE addresses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  label        TEXT NOT NULL DEFAULT 'Home',
  line1        TEXT NOT NULL,
  line2        TEXT,
  city         TEXT NOT NULL,
  state        TEXT,
  zip          TEXT,
  country_code TEXT NOT NULL,
  is_default   BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- DRUG CATALOG
-- ─────────────────────────────────────────────
CREATE TABLE categories (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name     TEXT NOT NULL,
  slug     TEXT UNIQUE NOT NULL,
  icon_url TEXT
);

CREATE TABLE drugs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  brand             TEXT,
  category_id       UUID REFERENCES categories,
  description       TEXT,
  base_price_usd    NUMERIC(10,2) NOT NULL,
  image_url         TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE drug_region_rules (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drug_id               UUID NOT NULL REFERENCES drugs ON DELETE CASCADE,
  region_id             UUID NOT NULL REFERENCES regions ON DELETE CASCADE,
  requires_prescription BOOLEAN NOT NULL DEFAULT false,
  schedule_class        TEXT,
  regulatory_label      TEXT,
  is_available          BOOLEAN NOT NULL DEFAULT true,
  price_local           NUMERIC(10,2),
  UNIQUE (drug_id, region_id)
);

-- ─────────────────────────────────────────────
-- PRESCRIPTIONS
-- ─────────────────────────────────────────────
CREATE TABLE prescriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  image_url   TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending', 'under_review', 'verified', 'rejected')),
  verified_by UUID REFERENCES auth.users,
  notes       TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_at TIMESTAMPTZ
);

-- ─────────────────────────────────────────────
-- ORDERS
-- ─────────────────────────────────────────────
CREATE TABLE carts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE cart_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id         UUID NOT NULL REFERENCES carts ON DELETE CASCADE,
  drug_id         UUID NOT NULL REFERENCES drugs,
  quantity        INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  prescription_id UUID REFERENCES prescriptions
);

CREATE TABLE orders (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID NOT NULL REFERENCES auth.users,
  status                   TEXT NOT NULL DEFAULT 'placed'
                           CHECK (status IN ('placed','confirmed','dispensed','shipped','delivered','cancelled')),
  region_id                UUID REFERENCES regions,
  currency_code            TEXT NOT NULL,
  subtotal                 NUMERIC(10,2) NOT NULL,
  tax_rate                 NUMERIC(5,4) NOT NULL DEFAULT 0,
  tax_amount               NUMERIC(10,2) NOT NULL DEFAULT 0,
  total                    NUMERIC(10,2) NOT NULL,
  address_id               UUID REFERENCES addresses,
  payment_method           TEXT NOT NULL DEFAULT 'cod',
  payment_status           TEXT NOT NULL DEFAULT 'pending'
                           CHECK (payment_status IN ('pending','paid','refunded')),
  stripe_payment_intent_id TEXT,
  notes                    TEXT,
  placed_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE order_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES orders ON DELETE CASCADE,
  drug_id         UUID NOT NULL REFERENCES drugs,
  quantity        INT NOT NULL,
  unit_price_local NUMERIC(10,2) NOT NULL,
  prescription_id UUID REFERENCES prescriptions
);

CREATE TABLE order_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   UUID NOT NULL REFERENCES orders ON DELETE CASCADE,
  status     TEXT NOT NULL,
  note       TEXT,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────────
CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  type       TEXT NOT NULL CHECK (type IN ('order_update','prescription_update','promo','system')),
  read       BOOLEAN NOT NULL DEFAULT false,
  payload    JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────
ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses        ENABLE ROW LEVEL SECURITY;
ALTER TABLE drugs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE drug_region_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders           ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_events     ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications    ENABLE ROW LEVEL SECURITY;
ALTER TABLE regions          ENABLE ROW LEVEL SECURITY;

-- Regions: public read
CREATE POLICY "regions_public_read" ON regions FOR SELECT USING (true);

-- Profiles: own row
CREATE POLICY "profiles_own" ON profiles FOR ALL USING (auth.uid() = id);

-- Addresses: own rows
CREATE POLICY "addresses_own" ON addresses FOR ALL USING (auth.uid() = user_id);

-- Drugs + categories: authenticated read
CREATE POLICY "drugs_auth_read"      ON drugs      FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "categories_auth_read" ON categories FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "drug_rules_auth_read" ON drug_region_rules FOR SELECT USING (auth.role() = 'authenticated');

-- Prescriptions: own rows; pharmacist/admin can read all
CREATE POLICY "prescriptions_own_read"   ON prescriptions FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('pharmacist', 'admin')
  ));
CREATE POLICY "prescriptions_own_insert" ON prescriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "prescriptions_admin_update" ON prescriptions FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('pharmacist', 'admin')));

-- Cart: own rows
CREATE POLICY "carts_own"      ON carts      FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "cart_items_own" ON cart_items FOR ALL
  USING (EXISTS (SELECT 1 FROM carts WHERE id = cart_id AND user_id = auth.uid()));

-- Orders: own rows; admin can read/update all
CREATE POLICY "orders_own_read"    ON orders FOR SELECT USING (auth.uid() = user_id OR EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('pharmacist', 'admin')
));
CREATE POLICY "orders_own_insert"  ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "orders_admin_update" ON orders FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('pharmacist', 'admin')));

CREATE POLICY "order_items_own" ON order_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM orders WHERE id = order_id AND user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('pharmacist','admin')));

CREATE POLICY "order_events_own" ON order_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM orders WHERE id = order_id AND user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('pharmacist','admin')));
CREATE POLICY "order_events_admin_insert" ON order_events FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('pharmacist','admin')));

-- Notifications: own rows
CREATE POLICY "notifications_own" ON notifications FOR ALL USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- TRIGGER: auto-create profile on user signup
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─────────────────────────────────────────────
-- STORAGE BUCKETS (run separately in Supabase dashboard
--   or via supabase CLI: supabase storage create-bucket)
-- ─────────────────────────────────────────────
-- Bucket: prescriptions (private)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('prescriptions', 'prescriptions', false);
