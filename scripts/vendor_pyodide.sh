#!/usr/bin/env bash
# Downloads Pyodide into vendor/pyodide so the playground works with no internet.
# The app automatically uses the vendored copy when it exists.
set -euo pipefail
VERSION="${1:-0.28.3}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/vendor/pyodide"
TMP="$(mktemp -d)"
URL="https://github.com/pyodide/pyodide/releases/download/${VERSION}/pyodide-core-${VERSION}.tar.bz2"

echo "Downloading Pyodide ${VERSION} (about 30 MB)…"
curl -L --progress-bar "$URL" -o "$TMP/pyodide.tar.bz2"
echo "Unpacking…"
mkdir -p "$DEST"
tar -xjf "$TMP/pyodide.tar.bz2" -C "$TMP"
cp -R "$TMP/pyodide/." "$DEST/"
rm -rf "$TMP"
echo "window.PYODIDE_LOCAL = true;" > "$ROOT/vendor/config.js"
echo "Done. Pyodide is in vendor/pyodide. The playground will use it automatically."
echo "Note: The editor and fonts are already local, so the app now works fully offline."
