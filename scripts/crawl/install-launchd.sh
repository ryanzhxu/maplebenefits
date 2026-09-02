#!/bin/bash
# Install (or reinstall) the crawl automation as a launchd user agent.
#
# Safe to re-run: it replaces any existing agent with the same label.
#
#   install:   bash scripts/crawl/install-launchd.sh
#   stop:      launchctl bootout gui/$(id -u)/com.maplebenefits.crawl
#   status:    launchctl print gui/$(id -u)/com.maplebenefits.crawl | head -20
set -euo pipefail

LABEL="com.maplebenefits.crawl"
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
TARGET="$HOME/Library/LaunchAgents/$LABEL.plist"

mkdir -p "$HOME/Library/LaunchAgents" "$REPO/data/crawl/logs"
sed "s|__REPO__|$REPO|g" "$REPO/scripts/crawl/$LABEL.plist" > "$TARGET"

# bootout is expected to fail when nothing is loaded yet.
launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$TARGET"

echo "installed: $TARGET"
launchctl print "gui/$(id -u)/$LABEL" | sed -n '1,6p'
