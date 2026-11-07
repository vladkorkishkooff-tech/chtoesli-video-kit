#!/bin/bash
cd /data/chtoesli/studio
export NODE_PATH=/vercel/sandbox/node_modules PW_CHROMIUM=/usr/local/bin/chromium
echo "START $(date +%T)" > /data/work/full_chan6.log
node tools/prender.cjs ep_blackout_calm_paper.html _r_chan6.mp4 --workers 4 >> /data/work/full_chan6.log 2>&1 && \
python3 tools/finish_mix.py _r_chan6.mp4 ../episodes/blackout_calm/timings.json ../episodes/blackout_calm ../review/blackout_stil_kanala_v6.mp4 >> /data/work/full_chan6.log 2>&1
echo "DONE $? $(date +%T)" >> /data/work/full_chan6.log
