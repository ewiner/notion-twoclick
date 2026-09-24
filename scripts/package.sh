#!/usr/bin/env bash
# Build the zip to upload to the Chrome Web Store: dist/notion-twoclick-<version>.zip
set -euo pipefail
cd "$(dirname "$0")/.."

version="$(sed -n 's/.*"version": *"\([^"]*\)".*/\1/p' manifest.json)"
out="dist/notion-twoclick-$version.zip"

mkdir -p dist
rm -f "$out"
zip -X -q "$out" manifest.json content.js popover.css icons/icon16.png icons/icon32.png icons/icon48.png icons/icon128.png
unzip -l "$out"
