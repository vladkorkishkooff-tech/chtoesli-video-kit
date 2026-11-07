const M = `(() => { const cat = heroL.previousElementSibling, b = cat.getBBox(), cape = you.g.querySelector('[clip-path$="c)"] path'), m = cape.getCTM().inverse().multiply(cat.getCTM());
  let n = 0, tot = 0, wx = [1e9, -1e9]; for (let x = b.x; x <= b.x + b.width; x += 2) for (let y = b.y; y <= b.y + b.height; y += 2) { const p = new DOMPoint(x, y).matrixTransform(m); tot++; if (cape.isPointInFill(p)) n++; }
  const c0 = new DOMPoint(b.x, b.y).matrixTransform(m), c1 = new DOMPoint(b.x + b.width, b.y + b.height).matrixTransform(m), cb = cape.getBBox();
  return {catW: [c0.x, c0.y, c1.x, c1.y].map(Math.round), capeBB: [cb.x, cb.y, cb.x + cb.width, cb.y + cb.height].map(Math.round), overlap: n + '/' + tot}; })()`;
module.exports = [
  {name: 'cat_52', t: 52.0, crop: [60, 980, 660, 380]},
  {name: 'cat_52m', t: 52.0, crop: [60, 980, 660, 380], js: M},
  {name: 'cat_48.6', t: 48.6, crop: [60, 980, 660, 380]},
  {name: 'cat_48.6m', t: 48.6, crop: [60, 980, 660, 380], js: M},
  {name: 'bath_13.5', t: 13.5, crop: [540, 650, 420, 430]},
];
