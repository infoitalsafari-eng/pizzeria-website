-- Migration: ajout colonne emoji dans categories_pizzeria
-- Task #15 — Pizzeria Chez Moi
--
-- Permet à l'admin de stocker un emoji par catégorie principale.
-- Les 4 catégories fixes reçoivent leur emoji par défaut.

ALTER TABLE categories_pizzeria
  ADD COLUMN IF NOT EXISTS emoji TEXT;

-- Initialiser les emojis des 4 catégories fixes
UPDATE categories_pizzeria SET emoji = '🍕'  WHERE name = 'Pizza'      AND parent_id IS NULL AND emoji IS NULL;
UPDATE categories_pizzeria SET emoji = '🍽️' WHERE name = 'Restaurant' AND parent_id IS NULL AND emoji IS NULL;
UPDATE categories_pizzeria SET emoji = '🍹'  WHERE name = 'Bar'        AND parent_id IS NULL AND emoji IS NULL;
UPDATE categories_pizzeria SET emoji = '🛒'  WHERE name = 'Boutique'   AND parent_id IS NULL AND emoji IS NULL;
