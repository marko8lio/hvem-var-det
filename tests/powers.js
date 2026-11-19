// Checks the special powers and the Christmas event.
const { G, bad, timers, html } = require("./harness")();
const EVENT = ["snowman", "santa", "elves", "rampenisse", "juletre"];
const out = {}, fails = [];
const check = (name, ok) => { if (!ok) fails.push(name); };
const play = id => { if (!G().save.owned.includes(id)) G().save.owned.push(id); G().act("choose", id); G().act("start", "easy"); G().act("go"); bad(); return G().ui.run.c; };
const KEY = { gossip_c: ["c", "color"], gossip_a: ["a", "acc"], gossip_s: ["s", "shoes"] };

// Adrian: one fart per case, one true clue per person in the room
let c = play("Adrian");
G().act("fart"); bad();
const farts = c.notes.length;
check("fart gives clues", farts >= 1);
check("fart clues are true", c.notes.every(n => { const r = n.parts[1]; if (r.k === "gossip_dog") return true; const [k, f] = KEY[r.k]; return c.outfits[c.culprit][k] === r[f]; }));
G().act("fart");
check("fart only once", c.notes.length === farts);

// Santa: 3 presents, each names an innocent
c = play("santa");
for (const l of ["reception", "hallway", "gym", "library"]) { c.loc = l; G().act("gift", "res:" + l); bad(); }
const cleared = Object.keys(c.cleared).filter(k => !k.startsWith("gift:"));
check("3 presents", c.gifts === 3);
check("presents never name the culprit", !cleared.includes(c.culprit));
out.presents = cleared.length;

// Snowman: one fight per case; 3 hits wins 1 point, 3 hits taken loses
c = play("snowman");
const p0 = G().save.points;
G().act("snow", "res:" + c.loc); bad();
G().act("snowhit"); G().act("snowhit"); G().act("snowhit"); bad();
check("snowball win", G().ui.snow.done === "win" && G().save.points - p0 === 1);
G().act("snowclose");
G().act("snow", "res:" + c.loc);
check("one fight per case", !G().ui.snow);
c = play("snowman");
G().act("snow", "res:" + c.loc); G().act("snowhit");
timers.at(-1)(); timers.at(-1)(); timers.at(-1)(); bad();
check("snowball lose", G().ui.snow.done === "lose");
G().act("snowclose");

// Elves: two figures with their own clocks; the case clock is the slower one
c = play("elves");
G().act("travel", "gym"); G().act("talk", "res:gym"); G().act("elf", "1"); G().act("travel", "library"); bad();
// event characters talk in 5 min
check("elves clocks", c.elfT[0] === 10 && c.elfT[1] === 5 && c.time === 10 && c.locs.join() === "gym,library");

// Rampenissen: never runs out of time
c = play("rampenisse");
for (let i = 0; i < 200; i++) G().act("travel", i % 2 ? "gym" : "hallway");
check("rampenissen never times out", G().ui.screen === "game" && c.time >= 1000); bad();

// Christmas tree: double stars
c = play("juletre"); let s0 = G().save.stars; c.loc = c.thiefAt; G().act("accuse", c.culprit);
check("tree gets 2 stars on easy", G().save.stars - s0 === 2);
c = play("rookie"); s0 = G().save.stars; c.loc = c.thiefAt; G().act("accuse", c.culprit);
check("rookie gets 1 star on easy", G().save.stars - s0 === 1);

// Markus: every power
c = play("Markus");
const hideout = c.thiefAt === "reception" ? c.trail[4] : c.thiefAt;
G().act("travel", hideout);
check("markus walks in 0 min", c.time === 0);
check("markus has elves", !!c.locs);
const h = html();
check("markus buttons", ["fart", "snow", "gift", "mind"].every(a => h.includes(`data-act="${a}"`)));
for (let i = 0; i < 300; i++) { c.talked = {}; G().act("talk", "res:gym"); }
check("markus never times out", G().ui.screen === "game");

// Mystery box: event characters about 1 in 200, never Markus/Jonas/Snute
G().save.owned = ["rookie"];
let event = 0, forbidden = 0;
const N = 60000;
for (let i = 0; i < N; i++) {
  G().save.points = 2;
  const before = new Set(G().save.owned), shards = G().save.shards;
  G().act("box");
  const got = G().save.owned.find(id => !before.has(id));
  // Snute may unlock on his own once duplicates have given 400 shards.
  if (got && (["Markus", "Jonas"].includes(got) || (got === "Snute" && shards + 5 < 400))) forbidden++;
  if (got && EVENT.includes(got)) event++;
}
out.eventCharactersWon = event;
check("box never gives Markus/Jonas/Snute", forbidden === 0);
check("all 5 event characters can be won", EVENT.every(id => G().save.owned.includes(id)));

// Screens render in both languages
G().act("lang", "no"); G().act("start", "easy"); G().act("go");
check("Klasserom A", html().includes("Klasserom A"));
for (const lang of ["no", "en"]) { G().act("lang", lang); G().act("chars"); bad(); G().act("home"); bad(); }
check("christmas banner", html().includes("Christmas event"));

console.log("powers:", out, fails.length ? { FAILED: fails } : "all ok");
if (fails.length) process.exit(1);
