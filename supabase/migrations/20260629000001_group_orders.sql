-- Migration: commandes groupées Boutique
-- Task #14 — Pizzeria Chez Moi
--
-- 3 tables : villes de livraison, créneaux (ville+date), commandes groupées
-- RLS : lecture publique des villes/créneaux actifs, INSERT anonyme sur group_orders,
-- accès complet authentifié (admin) sur les 3 tables.

-- ─── group_order_cities ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS group_order_cities (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  active     BOOLEAN     NOT NULL DEFAULT true,
  position   INTEGER     NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE group_order_cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY group_cities_public_read
  ON group_order_cities FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY auth_write_group_cities
  ON group_order_cities FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─── group_order_slots ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS group_order_slots (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id       UUID        NOT NULL REFERENCES group_order_cities(id) ON DELETE CASCADE,
  delivery_date DATE        NOT NULL,
  active        BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE group_order_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY group_slots_public_read
  ON group_order_slots FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY auth_write_group_slots
  ON group_order_slots FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─── group_orders ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS group_orders (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id      UUID        NOT NULL REFERENCES group_order_slots(id) ON DELETE RESTRICT,
  client_name  TEXT        NOT NULL,
  client_phone TEXT        NOT NULL,
  items        JSONB       NOT NULL DEFAULT '[]'::jsonb,
  total        NUMERIC     NOT NULL DEFAULT 0,
  status       TEXT        NOT NULL DEFAULT 'pending',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMPTZ
);

ALTER TABLE group_orders ENABLE ROW LEVEL SECURITY;

-- Anon peut soumettre une commande (sans compte client)
CREATE POLICY group_orders_anon_insert
  ON group_orders FOR INSERT
  TO anon
  WITH CHECK (true);

-- Authenticated (admin) : accès complet
CREATE POLICY auth_write_group_orders
  ON group_orders FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
