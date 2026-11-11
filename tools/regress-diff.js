/* Usage: node tools/regress-diff.js <before.json> <after.json>  — lists states whose text hash changed, count changes and new errors. */
const fs = require('fs');
const [a, b] = process.argv.slice(2).map(f => JSON.parse(fs.readFileSync(f, 'utf8')));
let n = 0;
for (const k of new Set([...Object.keys(a.states), ...Object.keys(b.states)])) { const x = a.states[k], y = b.states[k]; if (!x || !y || x.h !== y.h) { n++; console.log('TEXT ', k, x ? x.h + ' (' + x.n + ')' : '∅', '→', y ? y.h + ' (' + y.n + ')' : '∅'); } }
for (const k of new Set([...Object.keys(a.counts), ...Object.keys(b.counts)])) if (a.counts[k] !== b.counts[k]) { n++; console.log('COUNT', k, a.counts[k], '→', b.counts[k]); }
const ne = b.errors.filter(e => !a.errors.includes(e)); if (ne.length) { n += ne.length; console.log('NEW ERRORS', ne); }
console.log(n ? n + ' difference(s)' : 'identical: ' + Object.keys(b.states).length + ' states, ' + Object.keys(b.counts).length + ' counts, ' + b.errors.length + ' errors');
process.exit(n ? 1 : 0);
