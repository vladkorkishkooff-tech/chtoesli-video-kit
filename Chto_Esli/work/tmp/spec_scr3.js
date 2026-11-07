const V = {
  s1: {lean: -2, sh: [-160, 26], el: [-96, -84], hp: [-3, 4], kn: [3, 0], pk: [0, 1]},
  s2: {lean: -2, sh: [-168, 26], el: [-80, -84], hp: [-3, 4], kn: [3, 0], pk: [0, 1]},
  s3: {lean: -2, sh: [-172, 26], el: [-104, -84], hp: [-3, 4], kn: [3, 0], pk: [0, 1]},
  s4: {lean: -2, sh: [-158, 26], el: [-124, -84], hp: [-3, 4], kn: [3, 0], pk: [0, 1]},
};
const out = [];
for (const [n, p] of Object.entries(V)) for (const look of [1, -1])
  out.push({name: `${n}_${look > 0 ? 'R' : 'L'}`, t: 7.0, js: `you.keys([[0, {x: 1600, y: FL, pose: ${JSON.stringify(p)}, look: ${look}, vis: 1, fade: 1, sweater: 0, nod: 6}]]); null`});
module.exports = out;
