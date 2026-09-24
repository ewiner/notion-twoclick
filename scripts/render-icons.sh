#!/usr/bin/env bash
# Rasterize icons/icon.svg to the PNG sizes the manifest references, using
# headless Chrome (no other image tooling needed).
set -euo pipefail
cd "$(dirname "$0")/.."

CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

for s in 16 32 48 128; do
  svg="$(sed "s/viewBox=\"0 0 128 128\"/viewBox=\"0 0 128 128\" width=\"$s\" height=\"$s\" style=\"display:block\"/" icons/icon.svg)"
  printf '<html><body style="margin:0">%s</body></html>' "$svg" > "$tmp/$s.html"
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars \
    --default-background-color=00000000 --force-device-scale-factor=1 \
    --window-size="$s,$s" --screenshot="icons/icon$s.png" "file://$tmp/$s.html" 2>/dev/null
  echo "icons/icon$s.png"
done
