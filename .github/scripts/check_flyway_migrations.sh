#!/usr/bin/env bash
set -euo pipefail

MIGRATION_DIR="backend/src/main/resources/db/migration"
BASE_REF="${1:-}"
HEAD_REF="${2:-HEAD}"

if [[ ! -d "$MIGRATION_DIR" ]]; then
  echo "Migration directory not found: $MIGRATION_DIR" >&2
  exit 1
fi

if [[ -z "$BASE_REF" ]]; then
  if git rev-parse --verify HEAD^ >/dev/null 2>&1; then
    BASE_REF="HEAD^"
  else
    echo "No base ref available; skipping migration immutability check."
    exit 0
  fi
fi

echo "Checking Flyway migration immutability between $BASE_REF and $HEAD_REF"

disallowed_changes="$(
  git diff --name-status "$BASE_REF" "$HEAD_REF" -- "$MIGRATION_DIR" \
    | awk '$1 ~ /^(M|D|R|C)/ { print }'
)"

if [[ -n "$disallowed_changes" ]]; then
  echo "Flyway migration files are immutable once committed." >&2
  echo "Only new migration files may be added; existing files must not be modified, deleted, renamed, or copied." >&2
  echo "$disallowed_changes" >&2
  exit 1
fi

duplicate_versions="$(
  find "$MIGRATION_DIR" -maxdepth 1 -type f -name 'V*__*.sql' -printf '%f\n' \
    | sed -E 's/^V([0-9]+)__.*/\1/' \
    | sort -n \
    | uniq -d
)"

if [[ -n "$duplicate_versions" ]]; then
  echo "Duplicate Flyway migration version(s) found:" >&2
  echo "$duplicate_versions" >&2
  exit 1
fi

echo "Flyway migration guard passed."
