// Run with Node.js: node tests/noise-equivalence.cjs
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const crypto = require("node:crypto");
const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const reference = fs.readFileSync(path.join(__dirname, "fixtures/perlin-noise-original.js"), "utf8");
const noisePattern = /(<script id="PerlinNoise">)[\s\S]*?(<\/script>)/;
const baseline = html.replace(noisePattern, (_, start, end) => start + reference + end);
function context(source, seed, scene = false) {
  const c = {console: {log() {}}, Math: Object.create(Math), Date,
    window: {location: {href: "file:///test?seed=" + seed}, btoa: s => Buffer.from(s).toString("base64")}};
  vm.createContext(c);
  const scripts = Array.from(source.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g));
  for (let i = 0; i < (scene ? 6 : 3); i++) {
    // Browser input/UI setup follows the generator functions in the sixth script.
    const code = scene && i === 5 ? scripts[i][1].split('  document.addEventListener("mousemove"')[0] : scripts[i][1];
    vm.runInContext(code, c);
  }
  return c;
}
let compared = 0;
for (const seed of ["zero-z", "integer-z", "fractional-z"]) {
  const a = context(baseline, seed), b = context(html, seed);
  for (const detail of [[4, .5], [1, .5], [6, .65]]) {
    a.Noise.noiseDetail(...detail); b.Noise.noiseDetail(...detail);
    for (let i = 0; i < 2000; i++) {
      const x = (i - 999) / 17, y = (i % 73 - 36) / 9;
      for (const args of [[x], [x,y], [x,y,0], [x,y,2], [x,y,-3], [x,y,.5], [x,y,-.375], [x,y,.12345]]) {
        assert.ok(Object.is(a.Noise.noise(...args), b.Noise.noise(...args)), "noise mismatch " + args);
        compared++;
      }
    }
  }
  assert.equal(a.Prng.s, b.Prng.s, "random sequence changed");
  for (const noiseSeed of [0, 1234, undefined]) {
    a.Noise.noiseSeed(noiseSeed); b.Noise.noiseSeed(noiseSeed);
    for (let i = 0; i < 100; i++) assert.equal(a.Noise.noise(i/7,i/11,i/13),b.Noise.noise(i/7,i/11,i/13));
    assert.equal(a.Prng.s, b.Prng.s);
  }
}
console.log("PASS:", compared, "exact noise comparisons, detail settings, reseeding and PRNG state");
for (const seed of ["GroundSurf-profile", "dense-forest", "river-boats"]) {
  const a = context(baseline, seed, true), b = context(html, seed, true);
  a.MEM.windx = b.MEM.windx = 1422;
  a.chunkloader(0,2446); b.chunkloader(0,2446);
  const hash = c => crypto.createHash("sha256").update(c.MEM.chunks.map(x => x.canv).join("")).digest("hex");
  assert.equal(hash(a),hash(b),"scene output changed: " + seed);
  assert.equal(a.Prng.s,b.Prng.s);
  console.log("PASS: exact full-scene SVG", seed, hash(b));
}
