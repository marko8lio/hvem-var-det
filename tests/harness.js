// Loads the game script from v2/index.html into a fake browser so tests can drive it.
// Usage: const { G, html, bad, timers } = require("./harness")();
const fs = require("fs"), vm = require("vm"), path = require("path");
module.exports = function load() {
  const page = fs.readFileSync(path.join(__dirname, "..", "v2", "index.html"), "utf8");
  const code = page.slice(page.indexOf("<script>") + 8, page.lastIndexOf("</script>"));
  const state = { html: "" };
  const app = { set innerHTML(v) { state.html = v; }, get innerHTML() { return state.html; }, addEventListener() {} };
  const store = {}, timers = [];
  const win = { __TEST__: {}, scrollTo() {}, matchMedia: () => ({ matches: true }) };
  const ctx = {
    window: win, document: { getElementById: id => (id === "app" ? app : null), documentElement: {} },
    localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => (store[k] = v) },
    matchMedia: win.matchMedia, performance, console,
    setInterval: f => (timers.push(f), timers.length), clearInterval() {},
  };
  vm.createContext(ctx);
  vm.runInContext(code, ctx);
  const G = win.__TEST__.get;
  const bad = () => {
    const m = state.html.match(/.{0,80}(undefined|NaN|\{\w+\}).{0,40}/);
    if (m) throw new Error("broken text on screen: " + m[0]);
  };
  return { G, bad, timers, html: () => state.html };
};
