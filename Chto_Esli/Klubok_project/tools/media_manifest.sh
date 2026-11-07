#!/usr/bin/env bash
# Пересчитать отпечатки тяжёлых медиа (файлы, которые git не хранит).
# Результат — MEDIA.sha256. Проверка целостности: sha256sum -c MEDIA.sha256
set -euo pipefail
cd "$(dirname "$0")/.."
git ls-files --others --ignored --exclude-standard -z \
  | tr '\0' '\n' \
  | grep -v -E '^09_game/(\.godot|build)/|(^|/)(\.DS_Store|Thumbs\.db|desktop\.ini)$|/node_modules/|/__pycache__/' \
  | LC_ALL=C sort \
  | while IFS= read -r f; do sha256sum -- "$f"; done > MEDIA.sha256
echo "MEDIA.sha256: $(wc -l < MEDIA.sha256) файлов"
