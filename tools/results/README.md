# Check results

One file per full-suite run, named after the commit it ran against: `tools/results/<commit>.json`. A go-live round compares against the latest one instead of running the old commit again.

## What a file holds

`node tools/run-suite.js` writes it (after every check, so a stopped run still leaves what it has):

- `commit`, `started`, `finished`, `clean` (true only when every check exited 0 with no failed line)
- `checks[]`: `check`, `exit`, `pass`, `fail`, `failed[]` (the FAIL lines, trimmed), `seconds`, `commit`

Logs go to `/tmp/suite-<commit>/` (not kept in the repo). A check's `commit` can differ from the file's when one check was re-run after a fix; the note in the file says so.

## Running the suite (go-live rounds only)

```
NODE_PATH=<where playwright is> AXE=<path to axe.min.js> nohup node tools/run-suite.js > /tmp/suite.out 2>&1 &
```

It starts its own `python3 -m http.server` at the repo root (port 8731), runs the 20 checks one after another (the quick ones first, `stage5` and `axe` last), and takes roughly 1.5 hours on two cores. Never run anything else beside it: several checks measure timing and fail on a busy machine. A single failure from a busy machine shows as a timing difference (for example “resolves in about a quarter of a second :: 991”); re-run that check alone before calling it real.

Not in the suite: `perf-check.js` and `perf-ring.js` (they compare two builds; nothing passes or fails) and `regress.js` (the regression walk, below).

## Comparing a go-live run against the last results

1. Run the suite on the new head; it writes `tools/results/<new commit>.json`.
2. Compare per check: a check that passed in the last file and fails now is a regression; one that failed before and still fails is known (it should have a line in the change note). A check whose `pass` count drops without a `fail` is a check that lost coverage: look at it.
   `node -e "const a=require('./tools/results/<old>.json'),b=require('./tools/results/<new>.json');for(const c of b.checks){const o=a.checks.find(x=>x.check===c.check)||{};console.log(c.check.padEnd(10),'pass',o.pass,'→',c.pass,' fail',o.fail,'→',c.fail)}"`
3. The regression walk (what a visitor sees, state by state) is compared with the live commit (`main`), not with an old v2 commit: serve a checkout of `main` on another port (`git worktree add /tmp/live main`, `python3 -m http.server 8732` there; the build sandbox cannot reach eliasrutten.com itself), then `node tools/regress.js /tmp/live.json http://127.0.0.1:8732/imperial-stack/` and `node tools/regress.js /tmp/new.json`, then `node tools/regress-diff.js /tmp/live.json /tmp/new.json`.
4. Fix or report every failure; update stale expectations in the old checks in that round (not before); then save the new results file in the repo.
