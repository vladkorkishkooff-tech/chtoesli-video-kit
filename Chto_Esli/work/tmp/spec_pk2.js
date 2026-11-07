const K = (pose, look, extra = '') => `you.keys([[0, {x: 1600, y: FL, pose: '${pose}', look: ${look}, vis: 1, fade: 1, sweater: 0${extra}}]]); null`;
module.exports = [
  {name: 'pk_R', t: 7.0, js: K('pocket', 1)},
  {name: 'pk_L', t: 7.0, js: K('pocket', -1)},
  {name: 'scr_R', t: 7.0, js: K('scratch', 1)},
  {name: 'scr_L', t: 7.0, js: K('scratch', -1)},
  {name: 'mid_R', t: 5.0, js: `you.keys([[0, {x: 1600, y: FL, pose: 'stand', look: 1, vis: 1, sweater: 0}], [9.0, {pose: 'pocket'}], [3.0, {pose: 'stand'}]]); null`.replace('7.0', '')},
];
