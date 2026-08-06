#!/usr/bin/env bash
set -euo pipefail
if [[ $# -lt 1 ]]; then
  echo "Usage: ./scripts/restore.sh /path/to/backup.sqlite"
  exit 1
fi
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_PATH="${DB_PATH:-$ROOT_DIR/db/skellyforum.sqlite}"
cp "$1" "$DB_PATH"
echo "Restored $DB_PATH from $1"
