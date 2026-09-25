/**
 * Short-pitch specificity check, used by stage 1 of the validation gate.
 *
 * Kept free of imports so it can be unit-tested directly with Node
 * (`npm run test:specificity`) without a server or any API key.
 *
 * Length is not the test; specificity is. A pitch under SHORT_PITCH_WORDS words
 * must carry concrete detail of at least MIN_DETAIL_KINDS_FOR_SHORT_PITCH kinds.
 */

/** Below this many words a pitch has to prove it is specific, not just long enough. */
export const SHORT_PITCH_WORDS = 20;

/** A short pitch needs concrete details of at least this many different kinds. */
export const MIN_DETAIL_KINDS_FOR_SHORT_PITCH = 2;

// Word-start stems, so "manufacturing", "moulded" and "hospitals" all match.
const stems = (list: string[]) => new RegExp(`\\b(?:${list.join("|")})`, "i");

// Words after "for" that do not name a buyer ("for extra income", "for the future").
const NOT_A_BUYER = [
  "a", "an", "the", "my", "me", "myself", "us", "our", "extra", "more", "money", "income",
  "profit", "profits", "fun", "future", "now", "sale", "sales", "business", "people",
  "everyone", "all", "good", "free", "some", "any", "this", "that",
];

const PRICE_PATTERNS = [
  // A standalone number counts; "3D" or "5G" does not.
  /₹|\b\d+(?:[.,]\d+)*\b|\brs\.?\s*\d/i,
  /\b(?:rs|inr|rupees?|lakhs?|crores?|per (?:unit|piece|pack|kg|litre))\b/i,
];

const BUYER_PATTERNS = [
  stems([
    "industr", "hospital", "clinic", "pharmac", "doctor", "patient", "school", "college",
    "student", "kids?\\b", "child", "farmer", "agri", "restaurant", "cafe", "hotel", "retail",
    "wholesal", "distributor", "dealer", "b2b", "b2c", "d2c", "export", "customer", "buyer",
    "consumer", "household", "office", "corporate", "factor(?:y|ies)", "gym", "salon", "oem",
    "government", "municipal", "panchayat", "rural", "urban", "village", "cit(?:y|ies)",
    "metro", "india", "online", "amazon", "flipkart", "shops?\\b", "stores?\\b", "e-?commerce",
  ]),
  new RegExp(`\\bfor\\s+(?:the\\s+)?(?!(?:${NOT_A_BUYER.join("|")})\\b)[a-z]{3,}`, "i"),
];

const MATERIAL_PATTERNS = [
  stems([
    "manufactur", "production", "mou?ld", "stitch", "weav", "knit", "assembl", "3d print",
    "cnc", "machin", "inject", "extru", "casting", "forg(?:e|ed|ing)\\b", "ferment", "distill",
    "bak(?:e|ing|ery)", "packag", "bottling", "recycl", "upcycl", "handmade", "handcraft",
    "organic", "herbal", "ayurved", "steel", "stainless", "alumin", "iron", "copper", "brass",
    "plastic", "polymer", "cotton", "silk", "wool", "khadi", "bamboo", "wood", "leather", "glass",
    "ceramic", "rubber", "silicone", "paper", "jute", "clay", "coir", "fib(?:re|er)", "pcb",
    "sensor", "batter(?:y|ies)", "motor", "solar", "led\\b", "electric", "iot\\b", "bluetooth",
    "gps\\b",
  ]),
];

const DIFFERENTIATOR_PATTERNS = [
  stems([
    "cheaper", "affordable", "low[- ]cost", "biodegradable", "compostable", "eco[- ]?friendly",
    "reusable", "repairable", "patent", "import substitut", "locally made", "made in india",
  ]),
];

const DETAIL_SIGNALS: { kind: string; patterns: RegExp[] }[] = [
  { kind: "price, budget or quantity", patterns: PRICE_PATTERNS },
  { kind: "buyer or market", patterns: BUYER_PATTERNS },
  { kind: "material, component or process", patterns: MATERIAL_PATTERNS },
  { kind: "differentiator", patterns: DIFFERENTIATOR_PATTERNS },
];

/** Which kinds of concrete detail a pitch contains. Order-free and cheap. */
export function detectDetailKinds(text: string): string[] {
  return DETAIL_SIGNALS.filter((s) => s.patterns.some((p) => p.test(text))).map((s) => s.kind);
}

export interface SpecificityResult {
  wordCount: number;
  /** True when the pitch is short enough that it must prove it is specific. */
  short: boolean;
  kinds: string[];
  passes: boolean;
}

/** Stage 1's short-pitch rule: long pitches pass here and are judged by the AI gate. */
export function checkSpecificity(title: string, description: string): SpecificityResult {
  const combined = `${(title || "").trim()} ${(description || "").trim()}`.toLowerCase();
  const wordCount = combined.split(/\s+/).filter(Boolean).length;
  const short = wordCount < SHORT_PITCH_WORDS;
  const kinds = detectDetailKinds(combined);
  return { wordCount, short, kinds, passes: !short || kinds.length >= MIN_DETAIL_KINDS_FOR_SHORT_PITCH };
}
