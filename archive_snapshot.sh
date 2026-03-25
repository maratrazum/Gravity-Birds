#!/bin/zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
ARCHIVE_DIR="$ROOT_DIR/archives"
TIMESTAMP="$(date +%Y-%m-%d_%H-%M-%S)"

if git -C "$ROOT_DIR" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  REVISION="$(git -C "$ROOT_DIR" rev-parse --short HEAD)"
else
  REVISION="manual"
fi

mkdir -p "$ARCHIVE_DIR"

ARCHIVE_NAME="gravity_birds_${TIMESTAMP}_${REVISION}.tar.gz"
ARCHIVE_PATH="$ARCHIVE_DIR/$ARCHIVE_NAME"

tar \
  --exclude="./archives" \
  --exclude="./.venv" \
  --exclude="./__pycache__" \
  --exclude="./*.pyc" \
  -czf "$ARCHIVE_PATH" \
  -C "$ROOT_DIR" .

echo "$ARCHIVE_PATH"
