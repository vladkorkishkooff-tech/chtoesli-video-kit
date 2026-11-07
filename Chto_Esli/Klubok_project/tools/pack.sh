#!/usr/bin/env bash
# Упаковать проект в ZIP вместе с историей (.git) — без кеша Godot и готовых сборок.
#   tools/pack.sh          → ../Klubok_project_<тег или код шага>.zip
#   tools/pack.sh v0.4     → ../Klubok_project_v0.4.zip
set -euo pipefail
cd "$(dirname "$0")/.."
root="$(basename "$PWD")"
ver="${1:-$(git describe --tags --always 2>/dev/null || echo dev)}"
out="$(cd .. && pwd)/Klubok_project_${ver}.zip"
if [ -n "$(git status --porcelain)" ]; then
  echo "Внимание: есть несохранённые изменения (tools/save.sh) — они попадут в ZIP, но не в историю." >&2
fi
rm -f "$out"
(cd .. && zip -r -q -X "$out" "$root" \
  -x "$root/09_game/.godot/*" "$root/09_game/build/web/*" "$root/09_game/build/*.zip" \
     "*/.DS_Store" "*/Thumbs.db" "*/__pycache__/*" "*/node_modules/*")
echo "$out  ($(du -h "$out" | cut -f1))"
