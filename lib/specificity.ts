/**
 * Short-pitch specificity check, used by stage 1 of the validation gate.
 *
 * Kept free of imports so it can be unit-tested directly with Node
 * (`npm run test:specificity`) without a server or any API key.
 *
 * Length is not the test; specificity is. Stage 1 only rejects a short pitch
 * that carries no concrete detail at all — a clear placeholder such as "I want
 * to start a shoe business". A short pitch with some detail goes on to the AI
 * gate, which judges by meaning whether it has enough ("too-vague" there).
 *
 * The split is deliberate. Keyword matching is cheap but cannot tell "for
 * hotels" from "for daily use" reliably, so it only makes the call it can make
 * with near-certainty and leaves the judgement calls to the model. The
 * thresholds were tuned against pitches labelled unanimously by three
 * independent reviewers; see scripts/specificity-cases.json.
 */

/** Below this many words a pitch has to prove it is specific, not just long enough. */
export const SHORT_PITCH_WORDS = 20;

/** Stage 1 rejects a short pitch with fewer kinds of concrete detail than this. */
export const MIN_DETAIL_KINDS_FOR_SHORT_PITCH = 1;

// Word-start stems, so "manufacturing", "moulded" and "hospitals" all match.
const stems = (list: string[]) => new RegExp(`\\b(?:${list.join("|")})`, "i");

/* ------------------------------------------------------------------ *
 * Things that look like detail but are not                            *
 * ------------------------------------------------------------------ */

const AMOUNT = String.raw`(?:(?:₹|rs\.?|inr)\s*)?(?:\d[\d.,]*\s*(?:k|lakhs?|lacs?|crores?|cr)?|lakhs|crores)`;
const PER_PERIOD = String.raw`(?:\s*(?:per|a|\/)\s*(?:month|year|day|annum)|\s*(?:monthly|yearly|annually|pm))?`;

/**
 * Removed before matching. A founder's income goal is not a unit price, a year
 * is not a quantity, and "for everyone" is not a buyer.
 */
const NOISE = [
  // Personal money goals: "earn 50000 monthly", "will make lakhs", "₹1 crore turnover".
  new RegExp(String.raw`\b(?:earn\w*|income|salary)\b[^.,;]{0,15}?${AMOUNT}${PER_PERIOD}`, "gi"),
  new RegExp(String.raw`\b(?:mak(?:e|ing)|target\w*)\s+(?:(?:₹|rs\.?|inr)\s*)?[\d.,]*\s*(?:k\b|lakhs?|lacs?|crores?|cr\b)${PER_PERIOD}`, "gi"),
  new RegExp(String.raw`${AMOUNT}\s*(?:turnover|revenue|profits?|income)`, "gi"),
  // Years, "24/7", "Industry 4.0", composition percentages, head-counts.
  /\b(?:19|20)\d{2}\b/g,
  /\b24\s*[x/]\s*7\b/gi,
  /\bindustry\s*4\.0\b/gi,
  /\b\d+(?:\.\d+)?\s*%/g,
  /\b\d+\s+(?:\w+\s+)?(?:friends|people|persons|members|partners|co-?founders|founders|years?|months?)\b/gi,
];

// "for X" that does not name a buyer: "for everyone", "for daily use", "for health".
const NOT_A_BUYER = [
  "a", "an", "the", "my", "me", "myself", "us", "our", "your", "extra", "more", "money", "income",
  "profit", "profits", "fun", "future", "now", "sale", "sales", "business", "people", "everyone",
  "everybody", "every", "all", "good", "free", "some", "any", "this", "that", "daily", "use",
  "health", "home", "family", "families", "life", "long", "better", "best", "you", "them",
  "growth", "success", "india",
];

/* ------------------------------------------------------------------ *
 * The four kinds of concrete detail                                   *
 * ------------------------------------------------------------------ */

const UNIT = String.raw`(?:k|kg|kgs|g|gm|gms|grams?|ml|ltr|l|litres?|liters?|pcs|pieces?|units?|nos|dozen|mm|cm|m|sq\.?\s*ft|v|w|kw|kwh|mah|hp|tons?|tonnes?|quintals?|packs?|sachets?|bags?|boxes?|bottles?|ply)`;

const PRICE_PATTERNS = [
  /₹|\b(?:rs\.?|inr)\s*\d|\b\d[\d,.]*\s*(?:\/-|rs\b|rupees|inr\b)/i,
  new RegExp(String.raw`\b\d[\d,.]*\s*${UNIT}\b`, "i"),
  // Any other standalone number ("500 litre", "5-10 cows"); "3D" and "5G" do not count.
  /\b\d+(?:[.,]\d+)*\b/,
  /\b(?:rupees?|lakhs?|crores?|thousand|hundred|dozen|bulk|moq|min(?:imum)? order|by the (?:hundred|thousand))\b/i,
  /\bper\s+(?:unit|piece|pack|kg|litre|dozen|month|day|sq)/i,
];

const BUYER_PATTERNS = [
  stems([
    // Buyers and segments
    "industr", "hospital", "clinic", "pharmac", "chemist", "doctor", "patient", "school", "colleges",
    "student", "kids?\\b", "child", "farmer", "kisa+n", "fpo\\b", "cooperative", "co-?op\\b",
    "agri", "orchard", "dair(?:y|ies)", "restaurant", "cafe", "canteen", "dhaba", "caterer",
    "hotel", "hostel", "temple", "wedding", "retail", "wholesal", "distributor", "dealer", "b2b",
    "b2c", "d2c", "export", "customer", "buyer", "consumer", "household", "offices", "corporate",
    "factor(?:y|ies)", "mills?\\b", "fabricator", "msme", "gym", "salon", "oem", "government",
    "govt", "municipal", "panchayat", "zilla", "army", "railway", "service cent", "repair shop",
    // Places and channels
    "rural", "urban", "village", "district", "taluka", "town", "cit(?:y|ies)", "metro",
    "highway", "nh\\s?\\d", "pan[- ]india", "mandi", "haat", "bazaar", "market\\b", "kirana",
    "supermarket", "mall", "fest", "exhibition", "online", "amazon", "flipkart", "meesho",
    "nykaa", "indiamart", "jiomart", "bigbasket", "blinkit", "zepto", "insta", "whatsapp",
    "shops?\\b", "stores?\\b", "stalls?\\b", "e-?commerce",
    // Manufacturing hubs and states named in pitches
    "mumbai", "delhi", "noida", "gurgaon", "gurugram", "pune", "nashik", "nagpur", "bengaluru",
    "bangalore", "chennai", "coimbatore", "tiruppur", "hyderabad", "kolkata", "ahmedabad", "surat",
    "rajkot", "morbi", "vadodara", "jaipur", "jodhpur", "ludhiana", "jalandhar", "moga", "kanpur",
    "lucknow", "agra", "moradabad", "varanasi", "indore", "bhopal", "patna", "bhagalpur",
    "ratnagiri", "kolhapur", "kutch", "anantapur", "guwahati", "kochi", "gujarat", "maharashtra",
    "punjab", "haryana", "rajasthan", "bihar", "kerala", "karnataka", "tamil nadu", "telangana",
    "andhra", "odisha", "assam", "uttar pradesh", "madhya pradesh", "west bengal",
  ]),
  // Someone buying, ordering or stocking it: "caterers buy", "chemists stock them".
  /\b(?:buy|buys|order|orders|rent|stock|stocks|stocked)\b/i,
  // A route to market: "sold at", "supplied to", "ship to", "listed on".
  /\b(?:sold|sell(?:s|ing)?|supplied|supply(?:ing)?|ship(?:s|ped|ping)?|deliver\w*|distribut\w*|listed)\s+(?:\w+\s+)?(?:at|on|to|via|through|thru|in|by|from)\b/i,
  new RegExp(String.raw`\bfor\s+(?:the\s+)?(?!(?:${NOT_A_BUYER.join("|")})\b)[a-z]{3,}`, "i"),
];

const MATERIAL_PATTERNS = [
  stems([
    // Processes
    "manufactur", "production", "mou?ld", "stitch", "weav", "woven", "knit", "handloom",
    "assembl", "3d print", "cnc", "machin", "inject", "extru", "casting", "forg(?:e|ed|ing)\\b",
    "ferment", "distill", "bak(?:e|ing|ery)", "packag", "bottling", "recycl", "upcycl",
    "refurbish", "handmade", "hand[- ]made", "handcraft", "cold[- ]pressed", "pressed", "powder[- ]coat",
    "blow", "vacuum", "corrugat", "vermicompost", "compost", "dehydrat", "dried", "diy", "kits?\\b",
    // Materials and components
    "organic", "herbal", "ayurved", "steel", "stainless", "ss\\s?304", "ss\\b", "alumin", "iron",
    "copper", "brass", "plastic", "polymer", "pvc", "hdpe", "ldpe", "pp\\b", "rexine", "cotton",
    "silk", "wool", "khadi", "jute", "bamboo", "wood", "plywood", "mdf", "leather", "glass",
    "ceramic", "terracotta", "clay", "rubber", "silicone", "paper", "coir", "fib(?:re|er)",
    "banana", "areca", "neem", "moringa", "amla", "aloe", "jaggery", "millet", "pcb", "sensor",
    "batter(?:y|ies)", "motor", "led\\b", "iot\\b", "bluetooth", "gps\\b",
  ]),
];

const DIFFERENTIATOR_PATTERNS = [
  stems([
    "cheaper than", "half (?:the )?price", "half the", "import", "biodegradable", "compostable", "reusable", "repairable",
    "patent", "made in india", "locally made", "replacement",
  ]),
];

const DETAIL_SIGNALS: { kind: string; patterns: RegExp[] }[] = [
  { kind: "price, budget or quantity", patterns: PRICE_PATTERNS },
  { kind: "buyer, market or channel", patterns: BUYER_PATTERNS },
  { kind: "material, component or process", patterns: MATERIAL_PATTERNS },
  { kind: "differentiator", patterns: DIFFERENTIATOR_PATTERNS },
];

/** Which kinds of concrete detail a pitch contains. Order-free and cheap. */
export function detectDetailKinds(text: string): string[] {
  const cleaned = NOISE.reduce((t, pattern) => t.replace(pattern, " "), text);
  return DETAIL_SIGNALS.filter((s) => s.patterns.some((p) => p.test(cleaned))).map((s) => s.kind);
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
