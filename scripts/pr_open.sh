#!/usr/bin/env bash
set -euo pipefail

# Generic PR helper
# Usage:
#   BRANCH=feat/api-auth TITLE="feat(api): auth básica (signup/login + JWT)" \
#   BODY=$'Implementa cadastro e login com JWT.\n\nCloses #X\nRefs #Y' \
#   ./scripts/pr_open.sh [paths to add...]
#
# Env vars (override as needed):
BRANCH=${BRANCH:-"feat/auto-branch"}
BASE_BRANCH=${BASE_BRANCH:-"main"}
TITLE=${TITLE:-"chore: update"}
BODY=${BODY:-"Atualizações"}

# Ensure on latest base locally (non-fatal if no git)
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git fetch origin "$BASE_BRANCH" || true
fi

# Create/switch branch
if git rev-parse --verify "$BRANCH" >/dev/null 2>&1; then
  git checkout "$BRANCH"
else
  git checkout -b "$BRANCH"
fi

# Default paths to stage (can be overridden via args)
DEFAULT_PATHS=(
  apps/api/prisma/schema.prisma
  apps/api/prisma/migrations
  apps/api/Dockerfile
  .github/workflows/post-merge-automation.yml
  .github/workflows/ci.yml
  .gitignore
  README.md
)

if [ "$#" -gt 0 ]; then
  git add "$@" || true
else
  git add "${DEFAULT_PATHS[@]}" || true
fi

# Commit only if there is something staged
if ! git diff --cached --quiet; then
  git commit -m "$TITLE"
else
  echo "[info] Nada novo para commitar (stage vazio)."
fi

# Push branch
git push -u origin "$BRANCH"

# Open PR
if command -v gh >/dev/null 2>&1; then
  gh pr create -t "$TITLE" -b "$BODY" -H "$BRANCH" -B "$BASE_BRANCH" || {
    echo "[warn] Não foi possível abrir PR automaticamente. Verifique autenticação do gh e permissões." >&2
    exit 1
  }
  echo "[ok] PR criado com sucesso."
else
  echo "[warn] GitHub CLI (gh) não encontrado. PR não aberto automaticamente."
fi