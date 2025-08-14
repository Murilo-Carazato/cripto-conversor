#!/usr/bin/env bash
set -euo pipefail

# Generic PR helper
# Usage:
#   TITLE="feat(api): auth básica (signup/login + JWT)" \
#   BODY=$'Implementa cadastro e login com JWT.\n\nCloses #X\nRefs #Y' \
#   ./scripts/pr_open.sh
#
# Env vars (override as needed):
BASE_BRANCH=${BASE_BRANCH:-""}
TITLE=${TITLE:-"chore: update"}
BODY=${BODY:-"Atualizações"}
# Default assignee (current gh user) — override with ASSIGNEE
ASSIGNEE=${ASSIGNEE:-$(gh api user -q .login 2>/dev/null || echo "")}
# Comma-separated labels, e.g. "bug,api" — optional
LABELS=${LABELS:-""}
# Comma-separated reviewers, e.g. "alice,bob" — optional
REVIEWERS=${REVIEWERS:-""}
# Optional milestone title
MILESTONE=${MILESTONE:-""}
# Projects v2 ownership and project number to auto-add PR item — optional
OWNER=${OWNER:-"Murilo-Carazato"}
PROJECT_NUMBER=${PROJECT_NUMBER:-"19"}
# Optional relationships: comma-separated issue numbers (e.g., "12,45")
CLOSES=${CLOSES:-""}
REFS=${REFS:-""}

# Optional: project field setters
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/lib_project_fields.sh" ]; then
  . "$SCRIPT_DIR/lib_project_fields.sh"
fi

# Best-effort check for auth/scopes
if declare -F ghx_check_scopes >/dev/null 2>&1; then
  ghx_check_scopes || true
fi

# Parse custom per-PR flags from the argument list prefix (before any paths)
custom_status="" custom_priority="" custom_size="" custom_estimate="" custom_iteration=""
while [ "$#" -gt 0 ] && [[ "$1" == --* ]]; do
  case "$1" in
    --status|--priority|--size|--estimate|--iteration)
      key="$1"; shift; val="${1:-}"
      case "$key" in
        --status) custom_status="$val" ;;
        --priority) custom_priority="$val" ;;
        --size) custom_size="$val" ;;
        --estimate) custom_estimate="$val" ;;
        --iteration) custom_iteration="$val" ;;
      esac
      shift || true
      ;;
    --)
      shift; break ;;
    *)
      break ;;
  esac
done

## Nota: este script não executa operações git (fetch/add/commit/push).
## Certifique-se de já estar na branch correta e com commits prontos/push antes de chamar.

# Resolve base branch dinamicamente se não foi informada
if [ -z "$BASE_BRANCH" ]; then
  if command -v gh >/dev/null 2>&1; then
    BASE_BRANCH="$(gh repo view --json defaultBranchRef --jq .defaultBranchRef.name 2>/dev/null || echo "")"
  fi
  if [ -z "$BASE_BRANCH" ]; then
    BASE_BRANCH="$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null | sed 's#^origin/##' || echo "")"
  fi
  if [ -z "$BASE_BRANCH" ]; then
    BASE_BRANCH="$(git remote show origin 2>/dev/null | awk -F': ' '/HEAD branch/ {print $2; exit}' || echo "")"
  fi
  if [ -z "$BASE_BRANCH" ]; then
    BASE_BRANCH="main"
  fi
fi

# Pre-flight git checks (no git mutations; only hints)
cur_branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")"
if [ -z "$cur_branch" ] || [ "$cur_branch" = "HEAD" ]; then
  echo "[warn] Branch atual não detectada (HEAD destacado). Certifique-se de estar em uma branch antes de abrir a PR." >&2
fi
upstream="$(git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || echo "")"
if [ -z "$upstream" ]; then
  if [ -n "$cur_branch" ]; then
    echo "[info] Nenhum upstream configurado para '$cur_branch'. Se necessário, publique primeiro: git push -u origin $cur_branch" >&2
  fi
else
  ahead="$(git rev-list --count @{u}..HEAD 2>/dev/null || echo 0)" || ahead=0
  behind="$(git rev-list --count HEAD..@{u} 2>/dev/null || echo 0)" || behind=0
  if [ "${ahead:-0}" -gt 0 ] && [ "${behind:-0}" -gt 0 ]; then
    echo "[info] Histórico divergente em relação ao remoto (possível rebase local). Para atualizar a PR com segurança: git push --force-with-lease" >&2
  elif [ "${ahead:-0}" -gt 0 ] && [ "${behind:-0}" -eq 0 ]; then
    echo "[info] Você tem commits locais não enviados. Envie com: git push" >&2
  elif [ "${behind:-0}" -gt 0 ] && [ "${ahead:-0}" -eq 0 ]; then
    echo "[info] Sua branch está atrás do remoto. Considere atualizar antes: git pull --rebase" >&2
  fi
fi

# Build dynamic flags
PR_FLAGS=( -t "$TITLE" -b "$BODY" -B "$BASE_BRANCH" )

# Append closes/refs to body if provided (prefer shared helper)
if declare -F ghx_append_rel >/dev/null 2>&1; then
  BODY=$(ghx_append_rel "$BODY" "$CLOSES" "$REFS")
else
  append_rel() {
    local body="$1" closes="$2" refs="$3"
    if [ -n "$closes" ]; then
      IFS=',' read -r -a arr <<<"$closes"
      for n in "${arr[@]}"; do
        n="${n// /}"; [ -z "$n" ] && continue
        body+=$'\nCloses #'"$n"
      done
    fi
    if [ -n "$refs" ]; then
      IFS=',' read -r -a arr2 <<<"$refs"
      for n in "${arr2[@]}"; do
        n="${n// /}"; [ -z "$n" ] && continue
        body+=$'\nRefs #'"$n"
      done
    fi
    printf '%s' "$body"
  }
  BODY=$(append_rel "$BODY" "$CLOSES" "$REFS")
fi
PR_FLAGS=( -t "$TITLE" -b "$BODY" -B "$BASE_BRANCH" )

# Assignee, labels, milestone
if [ -n "$ASSIGNEE" ]; then PR_FLAGS+=( --assignee "$ASSIGNEE" ); fi
if [ -n "$LABELS" ]; then
  IFS=',' read -r -a lbls <<<"$LABELS"
  for l in "${lbls[@]}"; do
    l="${l// /}"
    [ -z "$l" ] && continue
    PR_FLAGS+=( --label "$l" )
  done
fi
if [ -n "$MILESTONE" ]; then PR_FLAGS+=( --milestone "$MILESTONE" ); fi

# Reviewers
if [ -n "$REVIEWERS" ]; then
  IFS=',' read -r -a rvs <<<"$REVIEWERS"
  for r in "${rvs[@]}"; do
    r="${r// /}"
    [ -z "$r" ] && continue
    PR_FLAGS+=( --reviewer "$r" )
  done
fi

# Open PR
if command -v gh >/dev/null 2>&1; then
  if declare -F ghx >/dev/null 2>&1; then
    pr_url=$(ghx pr create "${PR_FLAGS[@]}" | tail -n 1) || {
      echo "[warn] Não foi possível abrir PR automaticamente. Verifique autenticação do gh e permissões." >&2
      exit 1
    }
  else
    pr_url=$(gh pr create "${PR_FLAGS[@]}" | tail -n 1) || {
      echo "[warn] Não foi possível abrir PR automaticamente. Verifique autenticação do gh e permissões." >&2
      exit 1
    }
  fi
  # Robustly resolve PR URL from current branch if needed
  if ! echo "${pr_url:-}" | grep -Eq '^https?://github.com/'; then
    if declare -F ghx >/dev/null 2>&1; then
      pr_url=$(ghx pr view --json url --jq .url 2>/dev/null || echo "")
    else
      pr_url=$(gh pr view --json url --jq .url 2>/dev/null || echo "")
    fi
  fi
  # Optionally add PR to Projects v2 and set fields
  if [ -n "$PROJECT_NUMBER" ] && [ -n "${pr_url:-}" ]; then
    if declare -F ghx_project_add_and_set_fields >/dev/null 2>&1; then
      (
        export STATUS PRIORITY SIZE ESTIMATE ITERATION
        [ -n "$custom_status" ] && STATUS="$custom_status"
        [ -n "$custom_priority" ] && PRIORITY="$custom_priority"
        [ -n "$custom_size" ] && SIZE="$custom_size"
        [ -n "$custom_estimate" ] && ESTIMATE="$custom_estimate"
        [ -n "$custom_iteration" ] && ITERATION="$custom_iteration"
        ghx_project_add_and_set_fields "$pr_url" >/dev/null || true
      )
    else
      if declare -F ghx >/dev/null 2>&1; then
        item_id=$(ghx project item-add "$PROJECT_NUMBER" --owner "$OWNER" --url "$pr_url" --format json --jq .id 2>/dev/null || true)
        if [ -z "${item_id:-}" ]; then
          item_id=$(ghx project item-list "$PROJECT_NUMBER" --owner "$OWNER" --format json --jq '.items[] | select(.content.url=="'"$pr_url"'") | .id' 2>/dev/null | head -n1 || true)
        fi
      else
        item_id=$(gh project item-add "$PROJECT_NUMBER" --owner "$OWNER" --url "$pr_url" --format json --jq .id 2>/dev/null || true)
        if [ -z "${item_id:-}" ]; then
          item_id=$(gh project item-list "$PROJECT_NUMBER" --owner "$OWNER" --format json --jq '.items[] | select(.content.url=="'"$pr_url"'") | .id' 2>/dev/null | head -n1 || true)
        fi
      fi
      if [ -n "${item_id:-}" ] && declare -F ghx_set_fields_by_env >/dev/null 2>&1; then
        (
          [ -n "$custom_status" ] && STATUS="$custom_status"
          [ -n "$custom_priority" ] && PRIORITY="$custom_priority"
          [ -n "$custom_size" ] && SIZE="$custom_size"
          [ -n "$custom_estimate" ] && ESTIMATE="$custom_estimate"
          [ -n "$custom_iteration" ] && ITERATION="$custom_iteration"
          ghx_set_fields_by_env "$item_id"
        )
      fi
    fi
  fi
  echo "[ok] PR criado com sucesso."
else
  echo "[warn] GitHub CLI (gh) não encontrado. PR não aberto automaticamente."
fi