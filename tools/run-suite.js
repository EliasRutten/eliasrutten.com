/* The full check suite, one check after another (go-live rounds only; every other round runs the small set in claude/START-HERE.md).
   Usage: node tools/run-suite.js [--out=tools/results/<commit>.json] [--logs=<dir>] [--port=8731] [--only=a,b] [--skip=a,b]
   Starts `python3 -m http.server` at the repo root itself, runs each check with its own log file, and writes one results file:
   per check the exit code, the PASS and FAIL counts, the names of the failed lines, the seconds it took and the commit it ran against.
   Needs playwright (NODE_PATH may point to it) and axe-core (AXE=/path/to/axe.min.js, else `require.resolve('axe-core/axe.min.js')`).
   Order: the quick checks first, the slow ones (stage5, axe) last, so a broken page shows early.
   Measurements are not in the suite: tools/perf-check.js and tools/perf-ring.js compare two builds, they do not pass or fail.
   tools/regress.js is the regression walk: go-live rounds run it against the live commit (see tools/results/README.md). */
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const arg = (k, d) => { const a = process.argv.slice(2).find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const commit = execSync('git rev-parse --short HEAD', { cwd: root }).toString().trim();
const dirty = execSync('git status --porcelain --untracked-files=no', { cwd: root }).toString().trim() ? ' (uncommitted changes)' : '';
const out = path.resolve(root, arg('out', `tools/results/${commit}.json`));
const logs = path.resolve(root, arg('logs', `/tmp/suite-${commit}`));
const port = arg('port', '8731');
const only = arg('only', '').split(',').filter(Boolean);
const skip = arg('skip', '').split(',').filter(Boolean);
const base = `http://127.0.0.1:${port}/imperial-stack/`;
const ORDER = ['b4', 'b6', 'content', 'entry', 'fix', 'onboard', 'welcome', 'stage1', 'stage2', 'stage3', 'profit', 'arc', 'b1', 'b3',
  'interface', 'firms', 'clarity', 'tiers', 'stage5', 'axe'];
const list = ORDER.filter(n => (!only.length || only.includes(n)) && !skip.includes(n));
fs.mkdirSync(logs, { recursive: true });
fs.mkdirSync(path.dirname(out), { recursive: true });

/* the checks print in several shapes (PASS/FAIL lines, ok/FAIL lines, "N pass, M fail", "N passed, M failed", "all passed: N checks", "N of M checks pass", axe's one line a state); the exit code is what decides */
const count = text => {
  const lines = text.split('\n');
  const failed = lines.filter(l => /^\s*FAIL\b/.test(l)).map(l => l.trim().slice(0, 200));
  let pass = lines.filter(l => /^\s*(PASS|ok)\b/.test(l)).length, fail = failed.length;
  const v = lines.map(l => l.match(/: (\d+) violation\(s\)/)).filter(Boolean);   /* axe: one line a state */
  if (v.length) { pass = v.filter(m => +m[1] === 0).length; fail = Math.max(fail, v.length - pass); }
  const all = lines.map(l => l.match(/all passed: (\d+) checks|all (\d+) \w+ checks pass|^(\d+) of (\d+) checks pass/)).filter(Boolean).pop();
  if (all) { if (all[4]) { pass = +all[3]; fail = Math.max(fail, +all[4] - +all[3]); } else pass = +(all[1] || all[2]); }
  const sum = lines.map(l => l.match(/(\d+) pass(?:ed)?,? (\d+) fail(?:ed)?/)).filter(Boolean).pop();
  if (sum) { pass = +sum[1]; fail = Math.max(fail, +sum[2]); }
  return { pass, fail, failed };
};
if (require.main !== module) { module.exports = { count }; return; }
const run = name => new Promise(res => {
  const t0 = Date.now();
  const log = fs.openSync(path.join(logs, name + '.log'), 'w');
  const env = Object.assign({}, process.env);
  if (name === 'axe' && !env.AXE) { try { env.AXE = require.resolve('axe-core/axe.min.js'); } catch (e) { /* the script reports it */ } }
  const p = spawn('node', [path.join('tools', name + '-check.js'), base], { cwd: root, env, stdio: ['ignore', log, log] });
  p.on('close', code => {
    fs.closeSync(log);
    const c = count(fs.readFileSync(path.join(logs, name + '.log'), 'utf8'));
    res({ check: name, exit: code, pass: c.pass, fail: c.fail, failed: c.failed, seconds: Math.round((Date.now() - t0) / 1000), commit });
  });
});

(async () => {
  const srv = spawn('python3', ['-m', 'http.server', port, '--bind', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1200));
  const results = { commit: commit + dirty, started: new Date().toISOString(), base, checks: [] };
  const save = () => fs.writeFileSync(out, JSON.stringify(results, null, 1) + '\n');
  for (const n of list) {
    const r = await run(n);
    results.checks.push(r);
    console.log(`${r.exit === 0 && !r.fail ? 'OK  ' : 'FAIL'} ${n}  pass ${r.pass}  fail ${r.fail}  ${r.seconds}s`);
    save();   /* written after every check, so a stopped run still leaves what it has */
  }
  results.finished = new Date().toISOString();
  results.clean = results.checks.every(c => c.exit === 0 && !c.fail);
  save();
  srv.kill();
  console.log(results.clean ? 'SUITE CLEAN' : 'SUITE HAS FAILURES: ' + results.checks.filter(c => c.exit || c.fail).map(c => c.check).join(', '));
  process.exit(results.clean ? 0 : 1);
})();
