-- Migration: catégories & sous-catégories menu
-- Task #7 — Pizzeria Chez Moi
--
-- Sécurité : même modèle que les autres tables du projet (menu_items,
-- heures_pizzeria, informations_pizzeria, orders_pizzeria) : la lecture
-- est publique et toutes les écritures sont réservées aux utilisateurs
-- authentifiés (Supabase Auth). Un seul compte admin peut s'authentifier,
-- ce qui garantit que seul l'administrateur peut modifier les données.

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

-- Lecture publique (cohérent avec public_read_menu, public_read_heures, etc.)
CREATE POLICY categories_public_read
  ON categories_pizzeria FOR SELECT
  TO anon, authenticated
  USING (true);

-- Écritures réservées aux utilisateurs authentifiés (admin uniquement en
-- pratique — cohérent avec auth_write_menu, auth_write_heures, etc.)
CREATE POLICY auth_write_categories
  ON categories_pizzeria FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─── Seed : 4 catégories principales fixes ───────────────────────────────────
-- Ces 4 catégories correspondent aux onglets fixes du menu public.
-- Elles ne peuvent pas être renommées ni supprimées via l'interface admin.
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
