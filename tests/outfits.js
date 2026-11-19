// Every case must be solvable: nobody else looks exactly like the culprit,
// decoys in the hiding place differ in exactly one thing, and fixed clothes stay fixed.
const { G } = require("./harness")();
const FIX = { Alexsander: "black", Celine: "white", Klara: "grey" };
let n = 0, ambiguous = 0, fixedBroken = 0;
for (let i = 0; i < 3000; i++) {
  G().act("start", i % 2 ? "hard" : "easy");
  const c = G().ui.run.c;
  if (c.culprit === "Snute") continue;
  n++;
  const t = c.outfits[c.culprit];
  for (const [id, o] of Object.entries(c.outfits)) {
    if (FIX[id] && o.c !== FIX[id]) fixedBroken++;
    if (id !== c.culprit && o.c === t.c && o.a === t.a && o.s === t.s) ambiguous++;
  }
  for (const id of c.people[c.trail[4]]) if (id !== c.culprit) {
    const o = c.outfits[id];
    if (["c", "a", "s"].filter(k => o[k] !== t[k]).length !== 1) ambiguous++;
  }
}
console.log("outfits:", { cases: n, ambiguous, fixedBroken });
if (ambiguous || fixedBroken) process.exit(1);
