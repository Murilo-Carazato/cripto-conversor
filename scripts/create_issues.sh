#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./scripts/create_issues.sh
#   (Opcional) REPO="<owner>/<repo>" ./scripts/create_issues.sh
# Requires:
#   - GitHub CLI authenticated: gh auth login
# Notes:
#   - No external parsers needed. This script issues gh commands directly.

# Default repository if not provided via env var (infer via gh; fallback to default)
: "${REPO:=}"
if [ -z "$REPO" ]; then
  inferred_repo=$(gh repo view --json nameWithOwner --jq .nameWithOwner 2>/dev/null || echo "")
  if [ -n "$inferred_repo" ]; then
    REPO="$inferred_repo"
  else
    REPO="Murilo-Carazato/cripto-conversor"
  fi
fi
# Default owner (for Projects v2 item-add) and project number (optional)
: "${OWNER:=Murilo-Carazato}"
# If set, new issues will be added to this Projects v2 board
: "${PROJECT_NUMBER:=19}"
# Default assignee is the current authenticated GH user (can override via ASSIGNEE env)
: "${ASSIGNEE:=$(gh api user -q .login 2>/dev/null || echo "")}"
# Optional milestone title (set via MILESTONE env); leave empty to skip
: "${MILESTONE:=}"

# Optional references for all created issues in this run (comma-separated numbers)
# Example: REFS="13,15" ./scripts/create_issues.sh
: "${REFS:=}"
# Optional parent issue to link as sub-issue for each created issue in this run
# Use PARENT env (deprecated: --parent flag). Accepts number, #n or full URL
# Example: PARENT="12" or PARENT="https://github.com/owner/repo/issues/12"

# Optional: project field setters
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/lib_project_fields.sh" ]; then
  . "$SCRIPT_DIR/lib_project_fields.sh"
fi

# Best-effort check for auth/scopes
if declare -F ghx_check_scopes >/dev/null 2>&1; then
  ghx_check_scopes || true
fi

append_refs() {
  local body="$1"
  local refs="$2"
  if [ -n "$refs" ]; then
    IFS=',' read -r -a arr2 <<<"$refs"
    for n in "${arr2[@]}"; do
      n="${n// /}"
      [ -z "$n" ] && continue
      body+=$'\nRefs #'"$n"
    done
  fi
  printf '%s' "$body"
}

# Local fallback to add sub-issue relation when helpers are unavailable
link_sub_issue() {
  local parent="$1"
  local child_url="$2"
  local parent_num=""
  if [[ "$parent" =~ github.com/.*/issues/([0-9]+) ]]; then
    parent_num="${BASH_REMATCH[1]}"
  else
    parent_num="${parent#\#}"
  fi
  local child_num="${child_url##*/}"
  [ -z "$parent_num" ] && return 0
  [ -z "$child_num" ] && return 0
  local repo="$REPO"
  local parent_node_id child_node_id
  parent_node_id=$(gh api "/repos/$repo/issues/$parent_num" --jq .node_id 2>/dev/null || true)
  child_node_id=$(gh api "/repos/$repo/issues/$child_num" --jq .node_id 2>/dev/null || true)
  if [ -n "$parent_node_id" ] && [ -n "$child_node_id" ]; then
    gh api graphql \
      -f query='mutation($issueId:ID!, $subIssueId:ID!){ addSubIssue(input:{issueId:$issueId, subIssueId:$subIssueId}) { issue { id } } }' \
      -F issueId="$parent_node_id" -F subIssueId="$child_node_id" >/dev/null || true
  fi
}

create_issue() {
  local title="$1"
  local body="$2"
  shift 2

  # Parse custom per-issue flags we support and keep pass-through flags for gh
  local custom_status="" custom_priority="" custom_size="" custom_estimate="" custom_iteration=""
  local -a passthrough=()
  while [ "$#" -gt 0 ]; do
    case "$1" in
      --parent)
        # Deprecated: map to PARENT env and warn
        shift
        PARENT="${1:-}"
        echo "[warn] --parent está depreciado; use PARENT=\"...\"" >&2
        ;;
      --status|--priority|--size|--estimate|--iteration)
        local key="$1"; shift
        local val="${1:-}"
        case "$key" in
          --status) custom_status="$val" ;;
          --priority) custom_priority="$val" ;;
          --size) custom_size="$val" ;;
          --estimate) custom_estimate="$val" ;;
          --iteration) custom_iteration="$val" ;;
        esac
        ;;
      *)
        passthrough+=( "$1" )
        ;;
    esac
    shift || true
  done

  # Build dynamic flags
  local mod_body
  if declare -F ghx_append_rel >/dev/null 2>&1; then
    # Explicitly pass empty closes to avoid adding Closes lines in issues
    mod_body=$(ghx_append_rel "$body" "" "$REFS")
  else
    mod_body=$(append_refs "$body" "$REFS")
  fi
  local -a flags=( --repo "$REPO" --title "$title" --body "$mod_body" )
  if [ -n "$ASSIGNEE" ]; then
    flags+=( --assignee "$ASSIGNEE" )
  fi
  if [ -n "$MILESTONE" ]; then
    flags+=( --milestone "$MILESTONE" )
  fi
  # Optional labels via env LABELS (comma-separated)
  if [ -n "${LABELS:-}" ]; then
    IFS=',' read -r -a lbls <<<"$LABELS"
    for l in "${lbls[@]}"; do
      l="${l// /}"
      [ -z "$l" ] && continue
      flags+=( --label "$l" )
    done
  fi
  # Pass-through extra flags (e.g., --label) excluding our custom flags above
  if [ "${#passthrough[@]}" -gt 0 ]; then
    flags+=( "${passthrough[@]}" )
  fi

  # Create issue and capture URL
  local created_url
  if declare -F ghx >/dev/null 2>&1; then
    created_url=$(ghx issue create "${flags[@]}" | tail -n 1)
  else
    created_url=$(gh issue create "${flags[@]}" | tail -n 1)
  fi
  echo "$created_url"

  # Optionally link as sub-issue based on PARENT env
  if declare -F ghx_set_parent_if_env >/dev/null 2>&1; then
    ghx_set_parent_if_env "$created_url"
  elif [ -n "${PARENT:-}" ]; then
    link_sub_issue "$PARENT" "$created_url"
  fi

  # Optionally add to Projects v2 and set fields
  if [ -n "$PROJECT_NUMBER" ] && [ -n "$created_url" ]; then
    if declare -F ghx_project_add_and_set_fields >/dev/null 2>&1; then
      (
        export STATUS PRIORITY SIZE ESTIMATE ITERATION
        [ -n "$custom_status" ] && STATUS="$custom_status"
        [ -n "$custom_priority" ] && PRIORITY="$custom_priority"
        [ -n "$custom_size" ] && SIZE="$custom_size"
        [ -n "$custom_estimate" ] && ESTIMATE="$custom_estimate"
        [ -n "$custom_iteration" ] && ITERATION="$custom_iteration"
        ghx_project_add_and_set_fields "$created_url" >/dev/null || true
      )
    else
      local item_id
      item_id=$(gh project item-add "$PROJECT_NUMBER" --owner "$OWNER" --url "$created_url" --format json --jq .id 2>/dev/null || true)
      if [ -z "${item_id:-}" ]; then
        item_id=$(gh project item-list "$PROJECT_NUMBER" --owner "$OWNER" --format json --jq '.items[] | select(.content.url=="'"$created_url"'") | .id' 2>/dev/null | head -n1 || true)
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
    # be gentle with API
    sleep 0.2
  fi
}

# Single-issue mode (mandatory TITLE and BODY)
if [ -z "${TITLE:-}" ] || [ -z "${BODY:-}" ]; then
  echo "Uso: TITLE='...' BODY='...' ./scripts/create_issues.sh [flags extras do gh: --label, --milestone, etc]" >&2
  exit 2
fi

# Create the issue and print URL
created_url=$(create_issue "$TITLE" "$BODY" "$@")
echo "$created_url"
exit 0
