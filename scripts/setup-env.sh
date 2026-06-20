#!/bin/sh
# Génère le .env.local à partir des secrets Replit (accessibles dans le shell)
ENV_FILE=".env.local"

write_var() {
  local key="$1"
  local val="$2"
  if [ -n "$val" ]; then
    echo "VITE_${key}=${val}" >> "$ENV_FILE"
  fi
}

# Réinitialiser le fichier
> "$ENV_FILE"

write_var "SUPABASE_URL" "$SUPABASE_URL"
write_var "SUPABASE_ANON_KEY" "$SUPABASE_ANON_KEY"

echo ".env.local généré avec les clés Supabase"
