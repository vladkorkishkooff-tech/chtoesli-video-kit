#!/bin/bash
# v7.1 (кот не под пледом, локти не обрезаны): сначала стиль канала, потом светлый вариант (по очереди — 2 ядра)
cd /data/chtoesli/studio
export NODE_PATH=/vercel/sandbox/node_modules PW_CHROMIUM=/usr/local/bin/chromium
L=/data/work/full_v71.log
echo "START chan $(date +%T)" > $L
node tools/prender.cjs ep_blackout_calm_paper.html _r_chan71.mp4 --workers 4 >> $L 2>&1 && \
python3 tools/finish_mix.py _r_chan71.mp4 ../episodes/blackout_calm/timings.json ../episodes/blackout_calm ../review/blackout_stil_kanala_v7_1.mp4 >> $L 2>&1
echo "DONE chan $? $(date +%T)" >> $L
echo "START light $(date +%T)" >> $L
Q='&look=light' node tools/prender.cjs ep_blackout_calm_paper.html _r_light71.mp4 --workers 4 >> $L 2>&1 && \
python3 tools/finish_mix.py _r_light71.mp4 ../episodes/blackout_calm/timings.json ../episodes/blackout_calm ../review/blackout_svetly_v7_1.mp4 >> $L 2>&1
echo "DONE light $? $(date +%T)" >> $L
