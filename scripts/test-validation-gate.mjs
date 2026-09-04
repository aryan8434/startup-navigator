/**
 * Validation gate test matrix.
 *
 * Exercises the two-stage gate in lib/validation.ts against a live server.
 * Half the cases are must-ACCEPT on purpose: a gate that rejects everything is
 * trivial to write and useless, and the real risk here is killing a legitimate
 * idea rather than letting a bad one through. Both accept-side cases below were
 * genuine false rejections caught during development — a fragmented-market
 * commodity product read as "no differentiation", and a low-tech process read
 * as under-capitalised.
 *
 * The gate is non-deterministic (it is a model call), so a single green run is
 * not proof. Use REPEAT to measure the flake rate:
 *
 *   npm run dev                                   # in another terminal
 *   npm run test:gate
 *   REPEAT=5 npm run test:gate
 *   BASE=https://your-deploy.vercel.app npm run test:gate
 */

const BASE = process.env.BASE || "http://localhost:3000";
const REPEAT = Math.max(1, Number(process.env.REPEAT) || 1);

const CASES = [
  /* ---------- must be REJECTED ---------- */
  {
    expect: "reject",
    codes: ["gibberish"],
    label: "keyboard mash",
    body: {
      title: "fhgg",
      description: "fhgg asdfgh qwerty zxcvbn mnbvc",
      category: "Manufacturing",
    },
  },
  {
    expect: "reject",
    codes: ["implausible", "not-a-product", "self-contradictory"],
    label: "headphones for fishes",
    body: {
      title: "headphones",
      description:
        "headphones worth 100000 rupees for fishes to listen to music underwater in ponds and aquariums",
      category: "Manufacturing",
      investmentTier: "₹5 Lakhs - ₹25 Lakhs",
    },
  },
  {
    expect: "reject",
    codes: ["not-a-product", "gibberish"],
    label: "goal, not a product",
    body: {
      title: "Make money fast",
      description:
        "I want to become very rich quickly and build a big successful company that earns a lot of profit every month.",
      category: "Manufacturing",
    },
  },
  {
    expect: "reject",
    codes: ["no-differentiation"],
    label: "headphones vs Apple, no edge",
    body: {
      title: "Premium headphones",
      description:
        "We will manufacture premium wireless headphones to compete directly with Apple AirPods Max and Sony. Same features, same quality, sold in India to everyone who listens to music.",
      category: "Hardware / Electronics",
      investmentTier: "₹25 Lakhs - ₹1 Crore",
    },
  },
  {
    expect: "reject",
    codes: ["capital-mismatch"],
    label: "clothing brand at ₹100 crore",
    body: {
      title: "Cloth business",
      description:
        "A small clothing label stitching cotton shirts and kurtas for local retail shops. We require 100 crore rupees investment to start this tailoring and garment stitching unit.",
      category: "FMCG / Consumer Goods",
      investmentTier: "₹1 Crore+",
    },
  },
  {
    expect: "reject",
    codes: ["capital-mismatch", "implausible"],
    label: "semiconductor fab on ₹4 lakh",
    body: {
      title: "Semiconductor wafer fabrication plant",
      description:
        "We will build a 7nm silicon wafer fabrication facility producing advanced logic chips with EUV lithography for global smartphone makers. Total capital available is 4 lakh rupees.",
      category: "Hardware / Electronics",
      investmentTier: "< ₹5 Lakhs",
    },
  },

  /* ---------- must be ACCEPTED (over-rejection guard) ---------- */
  {
    expect: "accept",
    label: "vague but real",
    // Regression: once rejected as "no-differentiation". Fragmented commodity
    // markets have no incumbent to displace, so being unremarkable is a quality
    // problem scored downstream, not a validity problem.
    body: {
      title: "Water bottle company",
      description:
        "We want to manufacture and sell stainless steel reusable water bottles to people living in Indian cities who buy them online and in retail stores.",
      category: "FMCG / Consumer Goods",
      investmentTier: "₹5 Lakhs - ₹25 Lakhs",
    },
  },
  {
    expect: "accept",
    label: "pet product, human buyer",
    body: {
      title: "GPS tracking collar for dogs",
      description:
        "A lightweight GPS collar for pet dogs that reports location to the owner's phone over LTE, with a rechargeable battery and waterproof housing. Sold to urban pet owners in India.",
      category: "Hardware / Electronics",
      investmentTier: "₹5 Lakhs - ₹25 Lakhs",
    },
  },
  {
    expect: "accept",
    label: "aquarium speaker (animal-adjacent, real)",
    // The counterpart to "headphones for fishes": the animal benefits but a
    // human buys and operates it, which is a real market.
    body: {
      title: "Underwater aquarium speaker",
      description:
        "A submersible low-frequency speaker for large public aquariums and hotel fish tanks, letting venues play ambient audio through the water. Sold to aquarium operators and hospitality venues.",
      category: "Hardware / Electronics",
      investmentTier: "₹5 Lakhs - ₹25 Lakhs",
    },
  },
  {
    expect: "accept",
    label: "headphones WITH a stated wedge",
    // Same category as the Apple case above; passes because it names concrete
    // edges (repairability, local manufacturing, a price point).
    body: {
      title: "Repairable modular headphones",
      description:
        "Over-ear headphones designed so every part unscrews and can be replaced by the owner: drivers, earpads, battery and cable. Manufactured in Chennai to cut import duty, priced at 6000 rupees against imported models at 25000, targeted at Indian students and repair-conscious buyers.",
      category: "Hardware / Electronics",
      investmentTier: "₹25 Lakhs - ₹1 Crore",
    },
  },
  {
    expect: "accept",
    label: "real niche materials play",
    // Regression: once rejected as under-capitalised. Growing mycelium in
    // moulds is low-tech and genuinely starts at a few lakhs.
    body: {
      title: "Mycelium biodegradable packaging crates",
      description:
        "We grow packaging crates from agricultural waste substrate inoculated with mushroom mycelium, moulded over seven days then heat dried. Replaces polystyrene for cold chain shipping. Buyers are Indian agri exporters needing compostable packaging for EU rules.",
      category: "GreenTech / Sustainability",
      investmentTier: "₹5 Lakhs - ₹25 Lakhs",
    },
  },
];

const pad = (s, n) => String(s).padEnd(n);
const avg = (a) => (a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : 0);

async function runCase(c) {
  const startedAt = Date.now();
  let report = null;
  let error = null;

  try {
    const res = await fetch(`${BASE}/api/feasibility`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(c.body),
    });
    report = (await res.json()).report;
  } catch (e) {
    error = e.message;
  }

  const ms = Date.now() - startedAt;
  if (!report) return { label: c.label, ok: false, detail: `request failed: ${error}`, ms };

  const v = report.validation;
  const wasRejected = v ? !v.valid : report.feasibilityScore === 0;
  const gotCode = v?.code ?? null;
  const shouldReject = c.expect === "reject";

  // A rejection is correct when the reasoning is right. The internal code can
  // legitimately vary between neighbouring labels, so assert against a set.
  let ok = wasRejected === shouldReject;
  if (ok && shouldReject && c.codes && !c.codes.includes(gotCode)) ok = false;

  return {
    label: c.label,
    ok,
    ms,
    detail: wasRejected
      ? `REJECTED @${v?.stage} code=${gotCode}${
          c.codes && !c.codes.includes(gotCode) ? ` (expected one of ${c.codes.join("|")})` : ""
        } :: ${(v?.reason || "").slice(0, 82)}`
      : `ACCEPTED -> score ${report.feasibilityScore}, confidence ${report.confidence?.score}`,
  };
}

let totalPassed = 0;
let totalFailed = 0;

for (let run = 1; run <= REPEAT; run++) {
  const rows = [];
  for (const c of CASES) rows.push(await runCase(c));

  const passed = rows.filter((r) => r.ok).length;
  const failed = rows.length - passed;
  totalPassed += passed;
  totalFailed += failed;

  console.log(`\n${"=".repeat(112)}`);
  if (REPEAT > 1) console.log(`RUN ${run} of ${REPEAT}`);
  for (const r of rows) {
    console.log(`${r.ok ? "PASS" : "FAIL"}  ${pad(r.label, 34)} ${pad(r.ms + "ms", 9)} ${r.detail}`);
  }
  console.log("=".repeat(112));

  const rejMs = rows.filter((_, i) => CASES[i].expect === "reject").map((r) => r.ms);
  const accMs = rows.filter((_, i) => CASES[i].expect === "accept").map((r) => r.ms);
  console.log(
    `${passed} passed, ${failed} failed of ${CASES.length}   ` +
      `avg rejected ${avg(rejMs)}ms · avg accepted ${avg(accMs)}ms`
  );
}

if (REPEAT > 1) {
  const total = totalPassed + totalFailed;
  console.log(
    `\nTOTAL across ${REPEAT} runs: ${totalPassed}/${total} checks passed ` +
      `(${((totalFailed / total) * 100).toFixed(1)}% flake rate)`
  );
}

process.exit(totalFailed ? 1 : 0);
