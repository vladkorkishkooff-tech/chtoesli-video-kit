#!/usr/bin/env bash
# Сохранить шаг в историю проекта: обновить отпечатки медиа и сделать коммит.
#   tools/save.sh "Шаг 7: что сделано"
# Не забудьте добавить запись в HISTORY.md (новые — сверху).
set -euo pipefail
cd "$(dirname "$0")/.."
msg="${1:?Опишите шаг: tools/save.sh \"Шаг N: что сделано\"}"
tools/media_manifest.sh
git add -A
name="$(git config user.name || true)"
if [ -z "$name" ]; then
  git -c user.name="Klubok" -c user.email="klubok@localhost" commit -q -m "$msg"
else
  git commit -q -m "$msg"
fi
git log -1 --format='%h  %ad  %s' --date=short
