---
name: Supabase migration Pizzeria Chez Moi
description: État de la migration Firebase → Supabase pour Pizzeria Chez Moi (Garoua, Cameroun)
---

## Projet Supabase
- ID: `ibuuusegwfddykbalrei`
- URL: `https://ibuuusegwfddykbalrei.supabase.co`
- Anon key: secret Replit `SUPABASE_ANON_KEY`
- Service role key: à récupérer via Management API (non stockée en secret Replit)
- Access token: secret Replit `SUPABASE_ACCESS_TOKEN`

## Tables créées (Stage 2 — terminé)
- `menu_items` : 325 produits migrés depuis `src/data/menuPizzeria.ts`
- `heures_pizzeria` : 7 jours Lundi–Dimanche, 08H00–23H00
- `orders_pizzeria` : vide (Firestore était vide)
- `informations_pizzeria` : 1 ligne (instagram, facebook, whatsapp, service, maps)

## RLS + Policies
- Lecture publique (anon) sur les 4 tables
- Écriture réservée aux utilisateurs `authenticated`

## Compte admin Supabase Auth
- Créé via `POST https://{proj}.supabase.co/auth/v1/admin/users` avec service_role key
- Email et password dans secrets Replit `ADMIN_EMAIL` / `ADMIN_PASSWORD`
- `email_confirmed_at` = confirmé d'office (pas besoin de valider l'email)

## Endpoints Management API utiles
- SQL: `POST https://api.supabase.com/v1/projects/{proj}/database/query` → 201 OK
- API keys: `GET https://api.supabase.com/v1/projects/{proj}/api-keys`
- Auth users: `POST https://{proj}.supabase.co/auth/v1/admin/users` (Authorization: Bearer SERVICE_ROLE_KEY)
- `CREATE POLICY IF NOT EXISTS` non supporté → utiliser blocs `DO $$ BEGIN ... END $$`

## Fichiers importants
- `src/lib/supabase.ts` : client Supabase (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY)
- `src/integrations/supabase/client.ts` : doublon Lovable auto-généré (à unifier au Stage 3)
- `vite.config.ts` : injecte les vars via `define` depuis les secrets Replit
- `netlify/functions/api/api.mjs` : backend Firebase Admin SDK (à migrer au Stage 3)

**Why:** Les deux clients Supabase coexistent temporairement ; l'unification doit attendre Stage 3 pour éviter de casser les imports existants.

## Stage 3 (à faire)
1. Unifier les deux clients Supabase (`src/lib/supabase.ts` ← `src/integrations/supabase/client.ts`)
2. Brancher le frontend sur Supabase (menu, heures, infos, commandes)
3. Migrer le backend Netlify (`api.mjs`) de Firebase Admin vers Supabase service_role
4. Configurer `VITE_SUPABASE_SERVICE_ROLE_KEY` en secret Netlify pour le backend
