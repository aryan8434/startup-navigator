/**
 * Stage 1 short-pitch specificity test. Runs offline: no server, no API keys.
 *
 *   npm run test:specificity
 *
 * Cases live in scripts/specificity-cases.json. Every label there was given
 * unanimously by independent reviewers (the generating agent plus blind
 * judges) applying the same written policy, so a failure here is a detector
 * bug rather than a matter of taste.
 *
 * What is asserted:
 *   - label "accept": stage 1 must let it through. Wrongly bouncing a genuine
 *     founder is the costly mistake, so there is zero tolerance.
 *   - label "reject", stage1 "reject": stage 1 catches it for free today and
 *     must keep doing so.
 *   - label "reject", stage1 "gate": stage 1 hands it to the AI gate, which
 *     judges specificity by meaning. Reported, not asserted.
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const here = dirname(fileURLToPath(import.meta.url));
const { checkSpecificity } = await import(join(here, "../lib/specificity.ts"));
const cases = JSON.parse(readFileSync(join(here, "specificity-cases.json"), "utf8"));

const failures = [];
let improved = 0;

for (const c of cases) {
  const r = checkSpecificity(c.title, c.description);
  const pitch = `"${c.title}" / "${c.description}"`;

  if (c.label === "accept" && !r.passes) {
    failures.push(`genuine pitch rejected: ${pitch}  kinds=${JSON.stringify(r.kinds)}`);
  } else if (c.label === "reject" && c.stage1 === "reject" && r.passes) {
    failures.push(`placeholder no longer caught: ${pitch}  kinds=${JSON.stringify(r.kinds)}`);
  } else if (c.label === "reject" && c.stage1 === "gate" && !r.passes) {
    improved++;
  }
}

const count = (label, stage1) =>
  cases.filter((c) => c.label === label && (!stage1 || c.stage1 === stage1)).length;

console.log(
  `${cases.length} cases: ${count("accept")} genuine, ${count("reject")} low-effort ` +
    `(${count("reject", "reject")} caught at stage 1, ${count("reject", "gate")} left to the AI gate)`
);
if (improved) console.log(`${improved} gate-bound case(s) are now caught at stage 1 — update their "stage1" field.`);

if (failures.length) {
  console.log(`\n${failures.length} FAILED:`);
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
console.log("all passed");
