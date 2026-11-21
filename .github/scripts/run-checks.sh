#!/usr/bin/env bash
# Runs every tools/*-check.js one after another (never in parallel) against the server on :8731.
# A failing check is run once more; a pass on the second go is reported as "flaky pass".
# Skipped: axe-check (its own job) and perf-check (a measurement, not a pass/fail check).
set -u
mkdir -p ci-logs
S="${GITHUB_STEP_SUMMARY:-/dev/null}"
{
  echo "### Behaviour checks"
  echo
  echo "| Check | Result | PASS lines | FAIL lines | Seconds |"
  echo "|---|---|---|---|---|"
} >> "$S"
bad=0
run_one() { timeout 1500 node "$1" > "$2" 2>&1; local rc=$?; local f; f=$(grep -c '^FAIL' "$2" || true); if [ "$rc" -eq 0 ] && [ "${f:-0}" -gt 0 ]; then rc=1; fi; return $rc; }
for f in tools/*-check.js; do
  n=$(basename "$f" .js)
  case "$n" in axe-check|perf-check) continue;; esac
  t0=$(date +%s)
  log="ci-logs/$n.log"
  res="pass"
  if ! run_one "$f" "$log"; then
    cp "$log" "ci-logs/$n.first-try.log"
    if run_one "$f" "$log"; then res="flaky pass (failed once, passed on retry)"; else res="FAIL"; bad=1; fi
  fi
  p=$(grep -c '^PASS' "$log" || true); x=$(grep -c '^FAIL' "$log" || true)
  echo "| $n | $res | $p | $x | $(( $(date +%s) - t0 )) |" >> "$S"
  echo "== $n: $res"
  if [ "$res" = "FAIL" ]; then
    { echo; echo "<details><summary>$n: first failing lines</summary>"; echo; echo '```'; grep -m 12 -E '^FAIL|Error|error' "$log"; echo '```'; echo "</details>"; echo; } >> "$S"
  fi
done
exit $bad
