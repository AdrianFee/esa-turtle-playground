#!/usr/bin/env bash
# Downloads CodeMirror 5 into vendor/codemirror and rewrites index.html to use it,
# for fully offline use. Run after vendor_pyodide.sh.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
V="5.65.18"
BASE="https://cdnjs.cloudflare.com/ajax/libs/codemirror/${V}"
DEST="$ROOT/vendor/codemirror"
mkdir -p "$DEST"
for f in codemirror.min.css codemirror.min.js mode/python/python.min.js addon/edit/matchbrackets.min.js addon/edit/closebrackets.min.js addon/selection/active-line.min.js; do
  mkdir -p "$DEST/$(dirname "$f")"
  curl -sL "$BASE/$f" -o "$DEST/$f"
  echo "fetched $f"
done
sed -i.bak "s#https://cdnjs.cloudflare.com/ajax/libs/codemirror/${V}/#vendor/codemirror/#g" "$ROOT/index.html"
rm -f "$ROOT/index.html.bak"
echo "Done. index.html now loads CodeMirror from vendor/codemirror."
