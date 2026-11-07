#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p output
if [ ! -d node_modules/playwright ]; then echo 'Сначала запустите bash setup.sh' >&2; exit 1; fi
cd studio
node tools/shot.cjs ep_tongue_frost.html ../output/test.png 0.9
node tools/text_check.cjs ep_tongue_frost.html 0.2
printf '\nОткройте output/test.png и визуально проверьте кадр. Это не проверка звука и не полное ревью.\n'
