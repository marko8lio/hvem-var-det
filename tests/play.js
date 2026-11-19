// Plays many whole runs like a player would and checks every case can be solved.
const { G, bad } = require("./harness")();
let solved = 0, failed = 0;
for (const lang of ["en", "no"]) for (const mode of ["easy", "hard"]) for (let run = 0; run < 40; run++) {
  G().act("lang", lang); G().act("start", mode); bad();
  for (;;) {
    if (G().ui.screen === "intro") { G().act("go"); bad(); }
    const c = G().ui.run.c;
    let target = c.trail[0];
    for (let step = 0; step < 30 && G().ui.screen === "game"; step++) {
      G().act("travel", target); bad();
      if (G().ui.screen !== "game") break;
      G().act("talk", "res:" + target); bad();
      if (G().ui.screen !== "game") break;
      if (c.people[c.loc].includes(c.culprit)) {
        if (c.culprit !== "Snute") for (const p of c.people[c.loc]) { G().act("talk", p); bad(); if (G().ui.screen !== "game") break; }
        else G().act("talk", "Snute");
        if (G().ui.screen === "game") { G().act("accuse", c.culprit); bad(); }
        break;
      }
      const said = c.said.parts.find(p => p.loc);
      target = said ? said.loc : c.thiefAt;
    }
    const r = G().ui;
    if (r.screen !== "result") throw new Error("stuck on " + r.screen);
    bad();
    if (!r.result.ok) { failed++; break; }
    solved++;
    if (r.result.last) break;
    G().act("next");
  }
}
console.log("play:", { solved, failed });
if (failed) process.exit(1);
