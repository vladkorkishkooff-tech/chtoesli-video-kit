const K = (pose, look, x = 1600, extra = '') => `you.keys([[0, {x: ${x}, y: FL, pose: '${pose}', look: ${look}, vis: 1, fade: 1, sweater: 0${extra}}]])`;
module.exports = [
  {name: 'a_stand_L', t: 7.0, js: K('stand', -1)},
  {name: 'b_pocket_L', t: 7.0, js: K('pocket', -1)},
  {name: 'c_pocket_R', t: 7.0, js: K('pocket', 1)},
  {name: 'd_scratch_R', t: 7.0, js: K('scratch', 1)},
  {name: 'e_nod_R', t: 7.0, js: K('pocket', 1, 1600, ', nod: 12')},
  {name: 'f_bend_L', t: 17.8, js: `(() => { const x = 1325 - you.probe('bend', -1).hand0[0]; you.keys([[0, {x, y: FL, pose: 'bend', look: -1, vis: 1, sweater: 0}]]); return [x, you.probe('bend', -1).hand0]; })()`},
  {name: 'g_bendPull_L', t: 17.8, js: `(() => { const x = 1325 - you.probe('bend', -1).hand0[0]; you.keys([[0, {x, y: FL, pose: 'bendPull', look: -1, vis: 1, sweater: 0}]]); return you.probe('bendPull', -1).hand0; })()`},
  {name: 'h_sitToast', t: 52.2, js: K('sitToast', 1, 1765, ', sweater: 1')},
  {name: 'i_sitHug', t: 52.2, js: K('sitHug', 1, 1765, ', sweater: 1')},
  {name: 'j_sweater_stand', t: 7.0, js: K('stand', 1, 1600, ', sweater: 1')},
];
