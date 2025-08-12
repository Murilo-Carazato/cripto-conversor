#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   PROJECT_NUMBER=<number> ./scripts/add_issues_to_project.sh
#   (Opcionais) OWNER="<org-or-user>" REPO="<owner>/<repo>"
# Requires:
#   - GitHub CLI authenticated: gh auth login
# Notes:
#   - Adds all OPEN issues from the repository to the given Project (Projects v2).

if [ -z "${PROJECT_NUMBER:-}" ]; then
  echo "ERROR: set PROJECT_NUMBER=<number> before running." >&2
  exit 1
fi

# Defaults
: "${OWNER:=Murilo-Carazato}"
: "${REPO:=Murilo-Carazato/cripto-conversor}"

# List all open issues URLs and add to project
issue_urls=$(gh issue list --repo "$REPO" --state open --limit 500 --json url -q '.[].url')

if [ -z "$issue_urls" ]; then
  echo "No open issues found in $REPO." >&2
  exit 0
fi

echo "$issue_urls" | while read -r url; do
  [ -z "$url" ] && continue
  echo "Adding $url to project $OWNER/$PROJECT_NUMBER"
  gh project item-add "$PROJECT_NUMBER" --owner "$OWNER" --url "$url"
  # Be nice with API
  sleep 0.2
done

echo "✅ Issues adicionadas ao Project $OWNER/$PROJECT_NUMBER"
