-- Migration: catégories & sous-catégories menu
-- Task #7 — Pizzeria Chez Moi

-- ─── Table categories_pizzeria ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories_pizzeria (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  parent_id  UUID        REFERENCES categories_pizzeria(id) ON DELETE CASCADE,
  position   INTEGER     NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE categories_pizzeria ENABLE ROW LEVEL SECURITY;

CREATE POLICY categories_public_read
  ON categories_pizzeria FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY categories_admin_write
  ON categories_pizzeria FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─── Seed : 4 catégories principales fixes ───────────────────────────────────
INSERT INTO categories_pizzeria (name, position)
SELECT t.name, t.pos
FROM (VALUES
  ('Pizza',      1),
  ('Restaurant', 2),
  ('Bar',        3),
  ('Boutique',   4)
) AS t(name, pos)
WHERE NOT EXISTS (
  SELECT 1
  FROM categories_pizzeria c
  WHERE c.parent_id IS NULL AND c.name = t.name
);

-- ─── Colonne subcategory sur menu_items ──────────────────────────────────────
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS subcategory TEXT;
