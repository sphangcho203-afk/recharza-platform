#!/usr/bin/env bash
set -Eeuo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

log() {
  printf '\n[%s] %s\n' "$(date '+%H:%M:%S')" "$1"
}

fail() {
  printf '\nERROR: %s\n' "$1" >&2
  exit 1
}

read_env_value() {
  local name="$1"
  local line
  line="$(grep -E "^[[:space:]]*${name}=" .env 2>/dev/null | tail -n 1 || true)"
  printf '%s' "${line#*=}" | sed -E 's/^[[:space:]]+//; s/[[:space:]]+$//; s/^"(.*)"$/\1/; s/^'"'"'(.*)'"'"'$/\1/'
}

require_env() {
  local name="$1"
  local value
  value="$(read_env_value "$name")"
  [[ -n "$value" ]] || fail "$name is missing or empty in .env"
}

[[ -d .git ]] || fail "Run this inside the Recharza repository."
[[ -f package.json ]] || fail "package.json was not found."
[[ -f prisma/schema.prisma ]] || fail "Prisma schema was not found."

log "Repository: $REPO_ROOT"
printf 'Current branch: %s\n' "$(git branch --show-current || true)"

if [[ -n "$(git status --porcelain)" ]]; then
  STASH_NAME="phase1-rollout-backup-$(date '+%Y%m%d-%H%M%S')"
  log "Saving local work as Git stash: $STASH_NAME"
  git stash push -u -m "$STASH_NAME" >/dev/null
  printf 'Saved local changes. They remain recoverable with: git stash list\n'
fi

log "Updating main without rewriting history"
git fetch origin main
git switch main
git pull --ff-only origin main

[[ -f .env ]] || fail ".env is missing. Copy .env.example to .env and add local values before continuing."

log "Checking required local configuration without printing secrets"
for name in DATABASE_URL ORDER_ACCESS_SECRET RATE_LIMIT_SALT CRON_SECRET; do
  require_env "$name"
  printf 'OK  %s\n' "$name"
done

for pair in \
  "IGN_LOOKUP_PROVIDER:internal" \
  "PAYMENT_PROVIDER:internal"; do
  name="${pair%%:*}"
  expected="${pair#*:}"
  actual="$(read_env_value "$name")"
  if [[ "$actual" != "$expected" ]]; then
    printf 'WARN %s should be %s for the offline operational phase. Current value: %s\n' \
      "$name" "$expected" "${actual:-<empty>}"
  else
    printf 'OK  %s=%s\n' "$name" "$expected"
  fi
done

if [[ -z "$(read_env_value RESEND_API_KEY)" ]]; then
  printf 'WARN RESEND_API_KEY is empty. Account and order emails will be recorded as failed until configured.\n'
else
  printf 'OK  RESEND_API_KEY configured\n'
fi

if [[ -z "$(read_env_value RESEND_FROM_EMAIL)" ]]; then
  printf 'WARN RESEND_FROM_EMAIL is empty. Add a verified sender before testing email delivery.\n'
else
  printf 'OK  RESEND_FROM_EMAIL configured\n'
fi

log "Checking Node.js"
node -e '
const [major, minor] = process.versions.node.split(".").map(Number);
if (major < 20 || (major === 20 && minor < 19)) {
  console.error(`Node ${process.versions.node} is unsupported. Recharza requires Node >=20.19.0.`);
  process.exit(1);
}
console.log(`Node ${process.versions.node} accepted.`);
'

log "Installing locked dependencies"
if [[ -f package-lock.json ]]; then
  npm ci --silent
else
  npm install --silent
fi

log "Validating Prisma schema"
npm run db:validate

log "Applying committed migrations"
npm run db:deploy

log "Generating Prisma Client"
npm run db:generate

log "Running TypeScript verification"
npm run typecheck

log "Running ESLint"
npm run lint

log "Building the production bundle"
npm run build

cat <<'EOF'

============================================================
RECHARZA PHASE 1 ROLLOUT PASSED
============================================================

Start the local server in this repository:

  pkill -f "next dev" 2>/dev/null || true
  rm -rf .next
  npx next dev --webpack -H localhost -p 3000

Then, in a second Termux session, run:

  cd ~/projects/recharza-platform
  npm run smoke:phase1 -- --base=http://localhost:3000

Manual journey:
  1. /account -> create an account
  2. sign out -> sign in with email and password
  3. forgot password -> request and consume the email link
  4. /cart -> add a package and validate player details
  5. /games/mobile-legends/india -> complete billing and order
  6. finish the internal payment outcome
  7. confirm order history and email delivery records

Local work saved by this script remains in Git stash and is not deleted.
============================================================
EOF
