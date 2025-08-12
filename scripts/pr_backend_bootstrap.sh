#!/usr/bin/env bash
set -euo pipefail

# Defaults (override via env or args)
BRANCH=${BRANCH:-feat/day-2-backend-bootstrap}
TITLE=${TITLE:-"feat(api): bootstrap backend + Docker"}
BODY=${BODY:-$'Closes #1\nCloses #2\nCloses #4\nCloses #12\nRefs #5'}
MSG=${MSG:-$'feat(api): bootstrap backend (Node TS + Express + Prisma + Swagger) e Dockerfile; docs para rodar via Docker\n\n- Cria apps/api com Express + TypeScript, Zod para env, Swagger (/docs) e rota /health\n- Configura Prisma (schema inicial + client)\n- Adiciona Dockerfile da API e atualiza README com instruções (Docker)\n- Ajusta docker-compose para API em 3001\n\nCloses #1\nCloses #2\nCloses #4\nCloses #12\nRefs #5'}
BASE_BRANCH=${BASE_BRANCH:-main}

# Allow positional overrides: BRANCH MSG TITLE BODY
BRANCH=${1:-$BRANCH}
MSG=${2:-$MSG}
TITLE=${3:-$TITLE}
BODY=${4:-$BODY}

# Ensure gh is logged in
if ! command -v gh >/dev/null 2>&1; then
  echo "[erro] GitHub CLI (gh) não encontrado. Instale e faça login: https://cli.github.com/" >&2
  exit 1
fi

# Create or switch to branch
if git rev-parse --verify --quiet "$BRANCH" >/dev/null; then
  git checkout "$BRANCH"
else
  git checkout -b "$BRANCH"
fi

# Stage backend bootstrap files and CI workflow fix
git add apps/api docker-compose.yml README.md .github/workflows/ci.yml || true

# Commit only if there is something staged
if ! git diff --cached --quiet; then
  git commit -m "$MSG"
else
  echo "[info] Nada novo para commitar (stage vazio)."
fi

# Push branch
git push -u origin "$BRANCH"

# Open PR
gh pr create -t "$TITLE" -b "$BODY" -H "$BRANCH" -B "$BASE_BRANCH" || {
  echo "[warn] Não foi possível abrir PR automaticamente. Verifique autenticação do gh e permissões." >&2
  exit 1
}

echo "[ok] PR criado com sucesso."
