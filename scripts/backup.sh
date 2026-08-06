#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_PATH="${DB_PATH:-$ROOT_DIR/db/skellyforum.sqlite}"
BACKUP_DIR="${1:-$ROOT_DIR/db/backups}"
mkdir -p "$BACKUP_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
cp "$DB_PATH" "$BACKUP_DIR/skellyforum-$STAMP.sqlite"
echo "Backup written to $BACKUP_DIR/skellyforum-$STAMP.sqlite"
