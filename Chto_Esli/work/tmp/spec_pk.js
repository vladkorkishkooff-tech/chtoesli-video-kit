const K = (look, extra = '') => `you.keys([[0, {x: 1600, y: FL, pose: 'pocket', look: ${look}, vis: 1, fade: 1, sweater: 0${extra}}]]); null`;
const V = (sh, el) => `Object.assign(you.POSES.pocket, {sh: ${JSON.stringify(sh)}, el: ${JSON.stringify(el)}}); `;
module.exports = [
  {name: 'v1_R', t: 7.0, js: V([-35, -14], [94, -72]) + K(1)},
  {name: 'v1_L', t: 7.0, js: V([-35, -14], [94, -72]) + K(-1)},
  {name: 'v2_R', t: 7.0, js: V([-26, 18], [84, -70]) + K(1)},
  {name: 'v3_R', t: 7.0, js: V([-42, 24], [102, -80]) + K(1)},
  {name: 'v4_R', t: 7.0, js: V([-30, 26], [90, -84]) + K(1)},
  {name: 'scr2_R', t: 7.0, js: V([-30, 26], [90, -84]) + `Object.assign(you.POSES.scratch, {sh: [-150, 26], el: [-112, -84]}); you.keys([[0, {x: 1600, y: FL, pose: 'scratch', look: 1, vis: 1, sweater: 0}]]); null`},
  {name: 'bend_nod', t: 17.8, js: `(() => { const x = 1325 - you.probe('bend', -1).hand0[0]; you.keys([[0, {x, y: FL, pose: 'bend', look: -1, vis: 1, sweater: 0, nod: -28}]]); return null; })()`},
  {name: 'toast2', t: 52.2, js: `Object.assign(you.POSES.sitToast, {sh: [-58, -70], el: [-84, -80]}); you.keys([[0, {x: 1765, y: FL, pose: 'sitToast', look: 1, vis: 1, sweater: 1, nod: 6}]]); null`},
];
