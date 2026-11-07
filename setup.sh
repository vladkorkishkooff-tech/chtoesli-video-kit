#!/usr/bin/env bash
# Install only project-level packages; system packages must already be installed.
set -euo pipefail
cd "$(dirname "$0")"
for c in node npm python3 ffmpeg ffprobe; do
  command -v "$c" >/dev/null || { echo "Не найден $c. Установите его по ОКРУЖЕНИЕ.md." >&2; exit 1; }
done
npm ci --omit=dev
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
mkdir -p output
printf '\nГотово. Активируйте: source .venv/bin/activate\n'
printf 'Укажите Chromium: export PW_CHROMIUM="$(command -v chromium)"\n'
printf 'Затем выполните: bash verify.sh\n'
