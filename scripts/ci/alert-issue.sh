#!/usr/bin/env bash
# Opens, refreshes or closes the GitHub Issue a workflow uses to tell the owner something needs
# attention. Called from .github/workflows/*.yml; needs GH_TOKEN with `issues: write`.
#
#   alert-issue.sh open   <label> <title> [body-file]   new issue, or a COMMENT on the open one
#                                                       (a comment emails the assignee again)
#   alert-issue.sh update <label> <title> [body-file]   new issue, or silently REPLACE the body of
#                                                       the open one (no repeat email every run)
#   alert-issue.sh close  <label> <title>               close the open one, if any
#
# The issue is assigned to the repo variable ALERT_ASSIGNEE (a GitHub username), so the owner
# gets an email regardless of who or what started the run. See docs/OPERATIONS-RUNBOOK.md.
set -euo pipefail

action=$1 label=$2 title=$3 body_file=${4:-}
run_url="${GITHUB_SERVER_URL:-https://github.com}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID:-0}"

gh label create "$label" --color B60205 --description "Opened automatically by a workflow" --force >/dev/null 2>&1 || true

# Titles are fixed strings written in the workflows (no double quotes), so embedding is safe.
number=$(gh issue list --label "$label" --state open --limit 50 --json number,title \
  --jq ".[] | select(.title == \"$title\") | .number" | head -n 1)

body=""
if [ -n "$body_file" ] && [ -f "$body_file" ]; then
  # GitHub refuses an issue body over 65,536 characters (then the alert would be lost), so a long
  # report is cut and points to the run's summary, which always has the full list.
  max=60000
  if [ "$(wc -c < "$body_file")" -gt "$max" ]; then
    body="$(head -c "$max" "$body_file")"$'\n\n'"… (cut: the report is too long for an issue — the full list is in the workflow run's summary)"
  else
    body=$(cat "$body_file")
  fi
  # Report text includes Sheet content (titles typed into a public Form). "@name" there would
  # notify that GitHub user, so a zero-width space is put after every "@".
  zwsp=$(printf '\342\200\213')  # U+200B as UTF-8 bytes (works whatever the locale)
  body=${body//@/@$zwsp}
fi
message=$(printf '%s\n\n---\nWorkflow run: %s\n\nThis issue was opened automatically and closes itself once the problem is gone. What to do: docs/OPERATIONS-RUNBOOK.md\n' "$body" "$run_url")

create() {
  if [ -n "${ALERT_ASSIGNEE:-}" ] && gh issue create --title "$title" --label "$label" --assignee "$ALERT_ASSIGNEE" --body "$message"; then
    return 0
  fi
  # Assignee missing or not a collaborator: still open the issue rather than lose the alert.
  gh issue create --title "$title" --label "$label" --body "$message"
}

case "$action" in
  open)
    if [ -n "$number" ]; then gh issue comment "$number" --body "$message"; else create; fi ;;
  update)
    if [ -n "$number" ]; then gh issue edit "$number" --body "$message"; else create; fi ;;
  close)
    if [ -n "$number" ]; then gh issue close "$number" --comment "Resolved automatically — $run_url"; fi ;;
  *)
    echo "usage: $0 open|update|close <label> <title> [body-file]" >&2; exit 2 ;;
esac
