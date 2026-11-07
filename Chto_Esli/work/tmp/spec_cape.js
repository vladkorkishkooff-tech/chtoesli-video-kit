const K = (pose, pl, extra = '') => `you.keys([[0, {x: XC, y: FL, pose: '${pose}', look: 1, vis: 1, fade: 1, sweater: 1, plaid: ${pl}${extra}}]]); null`;
module.exports = [
  {name: 'c1_hug_pl0.5', t: 52.2, js: K('sitHug', 0.5)},
  {name: 'c2_hug_pl1', t: 52.2, js: K('sitHug', 1)},
  {name: 'c3_toast_pl1', t: 52.2, js: K('sitToast', 1, ', nod: 6')},
  {name: 'c4_sit_pl1', t: 52.2, js: K('sit', 1)},
  {name: 'c5_full', t: 52.2, crop: 'full', js: K('sitHug', 1)},
];
