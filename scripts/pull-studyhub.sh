#!/bin/sh

set -eu

REPOSITORY_DIR="/Users/selina/Library/CloudStorage/OneDrive-bbw.ch/Desktop-School/BMSW/StudyHub-onedrive"
LOG_DIR="$HOME/Library/Logs"
LOCK_DIR="$HOME/.studyhub-pull.lock"

mkdir -p "$LOG_DIR"
exec >> "$LOG_DIR/studyhub-pull.log" 2>&1

printf '\n[%s] Starting StudyHub pull\n' "$(date '+%Y-%m-%d %H:%M:%S')"

if ! mkdir "$LOCK_DIR" 2>/dev/null; then
    echo "Another StudyHub pull is already running; skipping."
    exit 0
fi
trap 'rmdir "$LOCK_DIR"' EXIT INT TERM

cd "$REPOSITORY_DIR"

if [ -n "$(git status --porcelain)" ]; then
    echo "Working tree is not clean; skipping pull to preserve local changes."
    exit 0
fi

git pull --ff-only origin main
printf '[%s] StudyHub pull finished\n' "$(date '+%Y-%m-%d %H:%M:%S')"