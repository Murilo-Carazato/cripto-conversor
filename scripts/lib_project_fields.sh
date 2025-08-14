#!/usr/bin/env bash
# Helper library to set GitHub Projects v2 fields for a given item (issue/PR)
# Requires GitHub CLI (gh) authenticated with access to Projects v2

# Config
: "${LOG_LEVEL:=info}"      # debug|info|warn|silent
: "${DRY_RUN:=0}"           # 1 to simulate without executing gh

# Logging helpers
log_debug() { [ "${LOG_LEVEL}" = "debug" ] && echo "[debug] $*" >&2 || true; }
log_info()  { case "${LOG_LEVEL}" in silent|warn) ;; *) echo "[info] $*" >&2 ;; esac; }
log_warn()  { [ "${LOG_LEVEL}" = "silent" ] || echo "[warn] $*" >&2; }

# Retry wrapper for gh with simple backoff and DRY_RUN support
ghx() {
  if [ "${DRY_RUN}" = "1" ]; then
    echo "[DRY_RUN] gh $*" >&2
    return 0
  fi
  local out rc attempt=1
  while :; do
    out=$(gh "$@" 2>&1); rc=$?
    if [ $rc -eq 0 ]; then
      printf '%s' "$out"
      return 0
    fi
    # Detect rate limiting or abuse detection
    if echo "$out" | grep -Eiq '(rate limit|secondary rate limit|429|abuse)'; then
      local sleep_s=$((attempt * 2))
      log_warn "gh command failed due to rate limit; retrying in ${sleep_s}s (attempt ${attempt})"
      sleep "$sleep_s"
      attempt=$((attempt + 1))
      [ $attempt -le 3 ] || break
      continue
    fi
    break
  done
  echo "$out" >&2
  return $rc
}

# Cache project id to avoid repeated lookups
__ghx_project_id=""

ghx_project_id() {
  if [ -n "$__ghx_project_id" ]; then
    printf '%s' "$__ghx_project_id"
    return 0
  fi
  if [ -z "${OWNER:-}" ] || [ -z "${PROJECT_NUMBER:-}" ]; then
    return 1
  fi
  local pid
  pid=$(ghx project view "$PROJECT_NUMBER" --owner "$OWNER" --format json --jq .id 2>/dev/null || true)
  __ghx_project_id="$pid"
  printf '%s' "$pid"
}

# Lookup caches
declare -A __ghx_field_id_cache
declare -A __ghx_option_id_cache

# Lookup a field id by its name with cache
# $1: Field name (e.g., "Status", "Priority")
ghx_field_id() {
  local fname="$1"
  if [ -n "${__ghx_field_id_cache[$fname]:-}" ]; then
    printf '%s' "${__ghx_field_id_cache[$fname]}"
    return 0
  fi
  local id
  id=$(ghx project field-list "$PROJECT_NUMBER" --owner "$OWNER" --format json \
    --jq '.fields[] | select(.name=="'"$fname"'") | .id' 2>/dev/null || true)
  __ghx_field_id_cache[$fname]="$id"
  printf '%s' "$id"
}

# Lookup option id for a single-select field with cache
# $1: Field name, $2: Option name
ghx_select_option_id() {
  local fname="$1" oname="$2" key
  key="$fname|$oname"
  if [ -n "${__ghx_option_id_cache[$key]:-}" ]; then
    printf '%s' "${__ghx_option_id_cache[$key]}"
    return 0
  fi
  local id
  id=$(ghx project field-list "$PROJECT_NUMBER" --owner "$OWNER" --format json \
    --jq '.fields[] | select(.name=="'"$fname"'") | .options[] | select(.name=="'"$oname"'") | .id' 2>/dev/null || true)
  __ghx_option_id_cache[$key]="$id"
  printf '%s' "$id"
}

# Canonicalize Status label (accepts various casings and separators)
# Examples: in_progress -> In progress; in-review -> In review
ghx_canon_status() {
  local v="${1:-}"
  v=$(printf '%s' "$v" | tr '[:upper:]' '[:lower:]')
  v=${v//_/ } ; v=${v//-/ }
  case "$v" in
    backlog) echo "Backlog" ;;
    ready) echo "Ready" ;;
    "in progress"|progress) echo "In progress" ;;
    "in review"|review) echo "In review" ;;
    done) echo "Done" ;;
    *) printf '%s' "$1" ;;
  esac
}

# Canonicalize Priority to P0/P1/P2
ghx_canon_priority() {
  local v="${1:-}"
  v=$(printf '%s' "$v" | tr '[:lower:]' '[:upper:]')
  case "$v" in
    P0|P1|P2) echo "$v" ;;
    0) echo "P0" ;;
    1) echo "P1" ;;
    2) echo "P2" ;;
    *) printf '%s' "$1" ;;
  esac
}

# Canonicalize Size to XS/S/M/L/XL
ghx_canon_size() {
  local v="${1:-}"
  v=$(printf '%s' "$v" | tr '[:lower:]' '[:upper:]')
  case "$v" in
    XS|S|M|L|XL) echo "$v" ;;
    *) printf '%s' "$1" ;;
  esac
}

# Set a single-select field by option name
# $1: item id, $2: field name, $3: option name (canonical)
ghx_set_single_select() {
  local item_id="$1" field_name="$2" opt_name="$3"
  [ -z "$item_id" ] && return 0
  [ -z "$opt_name" ] && return 0
  local project_id field_id option_id
  project_id=$(ghx_project_id)
  [ -z "$project_id" ] && return 0
  field_id=$(ghx_field_id "$field_name")
  [ -z "$field_id" ] && return 0
  option_id=$(ghx_select_option_id "$field_name" "$opt_name")
  [ -z "$option_id" ] && return 0
  gh project item-edit --id "$item_id" --project-id "$project_id" \
    --field-id "$field_id" --single-select-option-id "$option_id" >/dev/null 2>&1 || true
}

# Set a text/number field by value
# $1: item id, $2: field name, $3: value
ghx_set_text_or_number() {
  local item_id="$1" field_name="$2" val="$3"
  [ -z "$item_id" ] && return 0
  [ -z "$val" ] && return 0
  local project_id field_id
  project_id=$(ghx_project_id)
  [ -z "$project_id" ] && return 0
  field_id=$(ghx_field_id "$field_name")
  [ -z "$field_id" ] && return 0
  if [[ "$val" =~ ^-?[0-9]+([.][0-9]+)?$ ]]; then
    ghx project item-edit --id "$item_id" --project-id "$project_id" \
      --field-id "$field_id" --number "$val" >/dev/null 2>&1 || true
  else
    ghx project item-edit --id "$item_id" --project-id "$project_id" \
      --field-id "$field_id" --text "$val" >/dev/null 2>&1 || true
  fi
}

# Lookup Iteration value id by its title via GraphQL
# $1: iteration title
ghx_iteration_id_by_title() {
  local title="$1"
  [ -z "$title" ] && return 0
  # Query user-owned project. Adjust if OWNER is an org by changing 'user' to 'organization'.
    ghx api graphql \
    -f query='query($login:String!, $number:Int!){ user(login:$login){ projectV2(number:$number){ fields(first:100){ nodes{ ... on ProjectV2IterationField { id configuration { iterations { id title } } } } } } } }' \
    -F login="$OWNER" -F number="$PROJECT_NUMBER" \
    --jq '(.data.user.projectV2.fields.nodes[]? | select(.configuration.iterations) | .configuration.iterations[] | select(.title=="'"$title"'") | .id) // empty' 2>/dev/null || true
}

# Set Iteration field by iteration title
# $1: item id, $2: iteration title
ghx_set_iteration_by_title() {
  local item_id="$1" title="$2"
  [ -z "$item_id" ] && return 0
  [ -z "$title" ] && return 0
  local project_id field_id iter_id
  project_id=$(ghx_project_id)
  [ -z "$project_id" ] && return 0
  field_id=$(ghx_field_id "Iteration")
  [ -z "$field_id" ] && return 0
  # Try user-owned first; if not found, try organization-owned project
  iter_id=$(ghx_iteration_id_by_title "$title")
  if [ -z "$iter_id" ]; then
    iter_id=$(ghx api graphql \
      -f query='query($login:String!, $number:Int!){ organization(login:$login){ projectV2(number:$number){ fields(first:100){ nodes{ ... on ProjectV2IterationField { id configuration { iterations { id title } } } } } } } }' \
      -F login="$OWNER" -F number="$PROJECT_NUMBER" \
      --jq '(.data.organization.projectV2.fields.nodes[]? | select(.configuration.iterations) | .configuration.iterations[] | select(.title=="'"$title"'") | .id) // empty' 2>/dev/null || true)
  fi
  [ -z "$iter_id" ] && return 0
  ghx project item-edit --id "$item_id" --project-id "$project_id" \
    --field-id "$field_id" --iteration-id "$iter_id" >/dev/null 2>&1 || true
}

# Public entrypoint: set fields for an item based on environment variables
# Env vars supported (optional):
#   STATUS: Backlog | Ready | In progress | In review | Done
#   PRIORITY: P0 | P1 | P2 (accepts 0/1/2)
#   SIZE: XS | S | M | L | XL
#   ESTIMATE: number or text
#   ITERATION: iteration title to match exactly
# $1: item id
ghx_set_fields_by_env() {
  local item_id="$1"
  [ -z "$item_id" ] && return 0
  # Status
  if [ -n "${STATUS:-}" ]; then
    local canon
    canon=$(ghx_canon_status "$STATUS")
    ghx_set_single_select "$item_id" "Status" "$canon"
  fi
  # Priority
  if [ -n "${PRIORITY:-}" ]; then
    local p
    p=$(ghx_canon_priority "$PRIORITY")
    ghx_set_single_select "$item_id" "Priority" "$p"
  fi
  # Size
  if [ -n "${SIZE:-}" ]; then
    local s
    s=$(ghx_canon_size "$SIZE")
    ghx_set_single_select "$item_id" "Size" "$s"
  fi
  # Estimate
  if [ -n "${ESTIMATE:-}" ]; then
    ghx_set_text_or_number "$item_id" "Estimate" "$ESTIMATE"
  fi
  # Iteration
  if [ -n "${ITERATION:-}" ]; then
    ghx_set_iteration_by_title "$item_id" "$ITERATION"
  fi
}

# -----------------------------
# Parent issue relationship
# -----------------------------

# Extract owner/repo and number from an issue URL or use defaults
# Sets globals: __ghx_repo, __ghx_number
__ghx_repo=""; __ghx_number=""
ghx__parse_issue_ref() {
  local ref="$1"
  if [[ "$ref" =~ ^https?://github.com/.*/issues/[0-9]+ ]]; then
    __ghx_number=$(printf '%s' "$ref" | sed -E 's#.*/issues/([0-9]+).*#\1#')
    __ghx_repo=$(printf '%s' "$ref" | sed -E 's#https?://github.com/([^/]+/[^/]+)/issues/.*#\1#')
  else
    __ghx_number="$ref"
    __ghx_repo="${REPO:-}"  # expect REPO to be set like owner/repo
  fi
}

# Get GraphQL node ID for an issue ref (number or URL)
ghx_issue_node_id() {
  local ref="$1"
  ghx__parse_issue_ref "$ref"
  [ -z "$__ghx_repo" ] && return 1
  [ -z "$__ghx_number" ] && return 1
  ghx api \
    "/repos/$__ghx_repo/issues/$__ghx_number" \
    --jq .node_id 2>/dev/null || true
}

# Create sub-issue relationship: parent <- child
# $1: parent ref (url or number)
# $2: child ref (url or number)
ghx_add_sub_issue() {
  local parent_ref="$1" child_ref="$2"
  [ -z "$parent_ref" ] && return 0
  [ -z "$child_ref" ] && return 0
  local parent_id child_id
  parent_id=$(ghx_issue_node_id "$parent_ref")
  child_id=$(ghx_issue_node_id "$child_ref")
  [ -z "$parent_id" ] && return 0
  [ -z "$child_id" ] && return 0
  ghx api graphql \
    -f query='mutation($issueId:ID!, $subIssueId:ID!){ addSubIssue(input:{issueId:$issueId, subIssueId:$subIssueId}) { issue { id } }}' \
    -F issueId="$parent_id" -F subIssueId="$child_id" >/dev/null 2>&1 || true
}

# Public: if PARENT is set, link the child issue URL as sub-issue of PARENT
# $1: child issue URL
ghx_set_parent_if_env() {
  local child_url="$1"
  [ -z "${PARENT:-}" ] && return 0
  [ -z "$child_url" ] && return 0
  ghx_add_sub_issue "$PARENT" "$child_url"
}

# -----------------------------
# Small shared helpers
# -----------------------------

 # Append relationships (Closes/Refs) to a body string. Prints result to stdout
 # $1: base body, $2: CLOSES (comma-separated), $3: REFS (comma-separated)
 ghx_append_rel() {
   local body="$1" closes_in="${2:-}" refs_in="${3:-}"
   # Best-effort current repo for canonicalization (owner/repo)
   local __repo="${REPO:-}"
   if [ -z "$__repo" ] && command -v gh >/dev/null 2>&1; then
     __repo=$(gh repo view --json nameWithOwner --jq .nameWithOwner 2>/dev/null || echo "")
   fi

   # Trim helper
   _ghx__trim() { local s="$1"; s="${s#${s%%[![:space:]]*}}"; s="${s%${s##*[![:space:]]}}"; printf '%s' "$s"; }

   # Produce a canonical key for dedup. Prefer owner/repo#N when repo known.
   _ghx__canon_key() {
     local s="$(_ghx__trim "$1")" r="$2"
     # URL to issue or PR
     if [[ "$s" =~ ^https?://github.com/([^/]+/[^/]+)/issues/([0-9]+) ]]; then
       local rep="${BASH_REMATCH[1]}" num="${BASH_REMATCH[2]}"
       rep=$(printf '%s' "$rep" | tr '[:upper:]' '[:lower:]')
       printf '%s#%s' "$rep" "$num"; return 0
     fi
     if [[ "$s" =~ ^https?://github.com/([^/]+/[^/]+)/pull/([0-9]+) ]]; then
       local rep="${BASH_REMATCH[1]}" num="${BASH_REMATCH[2]}"
       rep=$(printf '%s' "$rep" | tr '[:upper:]' '[:lower:]')
       printf '%s#%s' "$rep" "$num"; return 0
     fi
     # owner/repo#N
     if [[ "$s" =~ ^([A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+)#([0-9]+)$ ]]; then
       local rep="${BASH_REMATCH[1]}" num="${BASH_REMATCH[2]}"
       rep=$(printf '%s' "$rep" | tr '[:upper:]' '[:lower:]')
       printf '%s#%s' "$rep" "$num"; return 0
     fi
     # #N or N
     if [[ "$s" =~ ^#?([0-9]+)$ ]]; then
       local num="${BASH_REMATCH[1]}"
       if [ -n "$r" ]; then
         local rep=$(printf '%s' "$r" | tr '[:upper:]' '[:lower:]')
         printf '%s#%s' "$rep" "$num"
       else
         printf '#%s' "$num"
       fi
       return 0
     fi
     printf ''
   }

   # How to display a ref (preserve URLs and cross-repo refs; normalize numbers)
   _ghx__display_ref() {
     local s="$(_ghx__trim "$1")"
     if [[ "$s" =~ ^https?://github.com/ ]]; then printf '%s' "$s"; return 0; fi
     if [[ "$s" =~ ^([A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+)#[0-9]+$ ]]; then printf '%s' "$s"; return 0; fi
     if [[ "$s" =~ ^#?([0-9]+)$ ]]; then printf '#%s' "${BASH_REMATCH[1]}"; return 0; fi
     printf '%s' "$s"
   }

   # Seed with existing refs in the body to avoid duplicates
   declare -A __seen_closes __seen_refs
   local line rest key
   while IFS= read -r line; do
     if [[ "$line" =~ ^[[:space:]]*Closes[[:space:]]+(.+)$ ]]; then
       rest="${BASH_REMATCH[1]}"; key="$(_ghx__canon_key "$rest" "$__repo")"
       [ -n "$key" ] && __seen_closes["$key"]=1
     elif [[ "$line" =~ ^[[:space:]]*Refs[[:space:]]+(.+)$ ]]; then
       rest="${BASH_REMATCH[1]}"; key="$(_ghx__canon_key "$rest" "$__repo")"
       [ -n "$key" ] && __seen_refs["$key"]=1
     fi
   done <<< "$body"

   # Helper to append uniquely
   _ghx__append_unique() {
     local kind="$1" tok="$2"
     local k="$(_ghx__canon_key "$tok" "$__repo")"
     [ -n "$k" ] || return 0
     if [ "$kind" = "C" ]; then
       [ -n "${__seen_closes[$k]:-}" ] && return 0
       body+=$'\nCloses '"$(_ghx__display_ref "$tok")"
       __seen_closes["$k"]=1
     else
       [ -n "${__seen_refs[$k]:-}" ] && return 0
       body+=$'\nRefs '"$(_ghx__display_ref "$tok")"
       __seen_refs["$k"]=1
     fi
   }

   local t
   if [ -n "$closes_in" ]; then
     IFS=',' read -r -a arr <<<"$closes_in"
     for t in "${arr[@]}"; do
       t="$(_ghx__trim "$t")"; [ -z "$t" ] && continue
       _ghx__append_unique "C" "$t"
     done
   fi
   if [ -n "$refs_in" ]; then
     IFS=',' read -r -a arr2 <<<"$refs_in"
     for t in "${arr2[@]}"; do
       t="$(_ghx__trim "$t")"; [ -z "$t" ] && continue
       _ghx__append_unique "R" "$t"
     done
   fi
   printf '%s' "$body"
 }

# Add an issue/PR URL to the configured Project and set fields via env
# Uses ghx (retry+DRY_RUN). Respects STATUS/PRIORITY/SIZE/ESTIMATE/ITERATION and their *_DEFAULT variants
# $1: content URL (issue or PR)
ghx_project_add_and_set_fields() {
  local url="$1"
  [ -z "${OWNER:-}" ] && return 0
  [ -z "${PROJECT_NUMBER:-}" ] && return 0
  [ -z "$url" ] && return 0
  local item_id
  item_id=$(ghx project item-add "$PROJECT_NUMBER" --owner "$OWNER" --url "$url" --format json --jq .id 2>/dev/null || true)
  if [ -z "${item_id:-}" ]; then
    item_id=$(ghx project item-list "$PROJECT_NUMBER" --owner "$OWNER" --format json \
      --jq '.items[] | select(.content.url=="'"$url"'") | .id' 2>/dev/null | head -n1 || true)
  fi
  [ -z "${item_id:-}" ] && return 0
  (
    ghx_set_fields_by_env "$item_id"
  )
  # be gentle with API
  sleep 0.2
}

# Quick check for auth/scopes; best-effort non-fatal
ghx_check_scopes() {
  if ! command -v gh >/dev/null 2>&1; then
    log_warn "GitHub CLI (gh) não encontrado."
    return 0
  fi
  gh auth status -t >/dev/null 2>&1 || log_warn "gh não autenticado (gh auth login)."
  # Try a lightweight projects call to detect missing scopes
  if [ -n "${OWNER:-}" ] && [ -n "${PROJECT_NUMBER:-}" ]; then
    ghx project view "$PROJECT_NUMBER" --owner "$OWNER" --format json --jq .id >/dev/null 2>&1 || \
      log_warn "Token pode não ter escopos suficientes para Projects v2."
  fi
}
