# v7.1: кот не под пледом; локти/колени не срезает фильтр #inkRough
import re, sys
P = '/data/chtoesli/studio/lib/paperhero.js'
s = open(P, encoding='utf-8').read()
if 'const bbx' in s: print('already'); sys.exit(0)
def rep(old, new, cnt=1):
    global s
    assert s.count(old) == cnt, (old[:80], s.count(old)); s = s.replace(old, new)
rep("      const inks = [], fills = [], limbs = [];\n",
    "      const inks = [], fills = [], limbs = [];\n"
    "      // невидимая рамка-габарит (суставы ± 0,08h): область фильтра #inkRough считается по габариту без толщины линий — без рамки срезались локти и колени\n"
    "      const bbx = el('path', {fill: 'none', stroke: 'none'}, g);\n")
rep("        setTube(armB, armPts(s.arms[1])); setTube(armF, armPts(s.arms[0]));\n",
    "        setTube(armB, armPts(s.arms[1])); setTube(armF, armPts(s.arms[0]));\n"
    "        { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; const pad = H * 0.08;\n"
    "          for (const L of [s.arms[0], s.arms[1], s.legs[0], s.legs[1]]) for (const q of L.pts) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); }\n"
    "          y0 = Math.min(y0, s.head[1] - H * 0.12); bbx.setAttribute('d', `M${(x0 - pad).toFixed(1)} ${(y0 - pad).toFixed(1)}L${(x1 + pad).toFixed(1)} ${(y1 + pad).toFixed(1)}`); }\n")
rep("pc(hip, -0.1, -0.06), pc(hip, -0.22, -0.045), pc(neck, -0.19, -0.15), pc(neck, -0.12, -0.03)",
    "pc(hip, -0.06, -0.06), pc(hip, -0.12, -0.05), pc(neck, -0.15, -0.16), pc(neck, -0.11, -0.03)")
rep("            const pts = [pc(neck, 0.035",
    "            // задний край идёт вдоль спины (не дальше ~0.13h за бёдрами): рядом на сиденье спит кот — плед его не накрывает\n            const pts = [pc(neck, 0.035")
rep("Q${F2(pc(hip, -0.12, 0.12))} ${F2(pc(hip, -0.1, -0.04))}", "Q${F2(pc(hip, -0.09, 0.12))} ${F2(pc(hip, -0.07, -0.04))}")
rep("      const root = el('g', {}, parent), g = el('g', {filter: 'url(#inkRough)'}, root), inks = [], fills = [];\n",
    "      const root = el('g', {}, parent), g = el('g', {filter: 'url(#inkRough)'}, root), inks = [], fills = [];\n"
    "      const bbx = el('path', {fill: 'none', stroke: 'none'}, g);   // рамка-габарит: фильтр не срезает локти (см. person)\n")
m = re.search(r"\n(        const X = S\.x, Y = S\.y, .*?P = \(x, y, lift = 0\) => \[X \+ x \* H, Y \+ y \* H - lift\];\n)", s)
assert m, 'back P'
s = s[:m.end()] + "        bbx.setAttribute('d', `M${F2(P(-0.32, -1.25))}L${F2(P(0.32, 0.06))}`);\n" + s[m.end():]
open(P, 'w', encoding='utf-8').write(s)
M = '/data/chtoesli/PROJECT.md'; t = open(M, encoding='utf-8').read()
a = "    - рендер — `work/full_v7.sh`: оба вида по очереди, ≈25 мин.\n"
if 'v7.1' not in t:
    assert t.count(a) == 1
    t = t.replace(a, a + "  - v7.1 (`review/blackout_stil_kanala_v7_1.mp4`, `review/blackout_svetly_v7_1.mp4`; замечания владельца «кота зажало одеялом», «в ванной у человека обрезаны локти»):\n"
      "    - плед на плечах: задний край идёт вдоль спины (`pc(hip, -0.12, -0.05)`, `pc(neck, -0.15, -0.16)`) и не заходит на кота на сиденье;\n"
      "    - обрезанные локти — из-за фильтра «кипения» `#inkRough`: его область считается по габариту фигуры без толщины линий, и толстые линии в крайних точках (локти, колени) обрезались прямой линией. Теперь в `person()` и `back()` есть невидимая рамка `bbx` (суставы рук и ног ± 0,08 h), она расширяет габарит. Правка работает во всех сценах;\n"
      "    - рендер — `work/full_v71.sh`.\n")
    open(M, 'w', encoding='utf-8').write(t)
print('patched')
