#!/usr/bin/env bash
# Render store/screenshots/slides.html into the Chrome Web Store images:
# three 1280x800 screenshots and the 440x280 small promo tile.
set -euo pipefail
cd "$(dirname "$0")/../store/screenshots"

CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"

render() { # <slide id> <out> <w> <h>
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --allow-file-access-from-files --window-size="$3,$4" --screenshot="$2" \
    "file://$PWD/slides.html#$1" 2>/dev/null
  echo "store/screenshots/$2"
}

render s1 1-hero.png 1280 800
render s2 2-popover.png 1280 800
render s3 3-features.png 1280 800
render tile promo-tile-440x280.png 440 280
