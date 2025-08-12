#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./scripts/create_labels.sh
#   (Opcional) REPO="<owner>/<repo>" ./scripts/create_labels.sh
# Creates common labels used by the project board.

# Default repository if not provided via env var
: "${REPO:=Murilo-Carazato/cripto-conversor}"

create_label() {
  local name="$1"; shift
  local color="$1"; shift
  local desc="$1"; shift

  # If label exists, update it; else, create it
  if gh label list --repo "$REPO" --search "$name" --json name -q '.[] | select(.name=="'$name'")' | grep -q "$name"; then
    gh label edit "$name" --repo "$REPO" --color "$color" --description "$desc" || true
  else
    gh label create "$name" --repo "$REPO" --color "$color" --description "$desc" || true
  fi
}

create_label "infra"    "6A5ACD" "Infrastructure and tooling"
create_label "backend"  "1D76DB" "Backend tasks"
create_label "frontend" "0E8A16" "Frontend tasks"
create_label "db"       "5319E7" "Database related"
create_label "auth"     "B60205" "Authentication"
create_label "api"      "D93F0B" "External/internal APIs"
create_label "feature"  "0052CC" "New feature"
create_label "docs"     "5319E7" "Documentation"
create_label "ui"       "FBCA04" "UI and styling"
create_label "quality"  "C2E0C6" "Quality and testing"
create_label "tests"    "C5DEF5" "Tests"
create_label "devops"   "9E6DFF" "CI/CD and operations"
create_label "ci"       "5319E7" "Continuous Integration"
create_label "deploy"   "5319E7" "Deployment"

echo "✅ Labels ensured on $REPO"
