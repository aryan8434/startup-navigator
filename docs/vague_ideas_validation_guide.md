# NxtVenture — Vague vs. Coherent Startup Idea Validation Guide

This document outlines the classification framework, validation matrix, screenshot step-by-step walk-throughs, and prompt engineering directives used by **NxtVenture** to detect and score vague, nonsensical, or gibberish pitches versus production-ready manufacturing blueprints.

---

## 1. Step-by-Step Validation Walk-through (Screenshots 1 - 4)

### Step 1: Vague Input Entry Submission (Keyboard Mashes)
When a user enters nonsensical, unparseable keyboard mashes (e.g. Title: `fgbfg`, Description: `ghfnghj`), the form submits the raw string for validation.

![Step 1: Vague Input Entry](/vague/Screenshot%202026-07-21%20144917.png)

* **Input Title:** `fgbfg` (Consonant ratio 100%, 0 vowels)
* **Input Description:** `ghfnghj` (Keyboard mash string)
* **Target Audience:** Left empty (default placeholder)

---

### Step 2: Unshielded Initial Scoring (Historical Defect Identified)
Prior to implementing the **Input Shield**, the unshielded heuristic engine assigned a `78 / 100` score to `fgbfg`. This was flagged as a product defect and prompted the creation of Tier 1 validation.

![Step 2: Historical Unshielded Defect](/vague/Screenshot%202026-07-21%20144927.png)

* **Defect Identified:** Gibberish text received a `78 / 100 Moderately Viable` score.
* **Resolution Implemented:** Built `checkIsGibberish()` regex shield and system prompt rejection directives.

---

### Step 3: Input Shield Rejection & Zero Score (`Score: 0 / 100`)
With the **Validation Shield** active, non-sensical inputs are immediately blocked. The system returns **`Score: 0 / 100 (Non-Viable / Invalid Input)`**, sets all financial metrics to `₹0`, and sets payback to `Never`.

![Step 3: Shield Rejection & Zero Score](/vague/Screenshot%202026-07-21%20145019.png)

* **Feasibility Score:** `0 / 100` (Red Badge)
* **Status Rating:** `Non-Viable / Invalid Input`
* **Financial Metrics:** Defaulted to `₹0` COGS, `0%` margin, and `Never` payback.

---

### Step 4: Multi-Line AI Report Box & Heading Badging
When evaluating a valid concept, the AI Report splits every point (1, 2, 3, 4, 5, 6, 7, 8) onto separate lines with **Purplish Tint Headings** and **Emerald Green Metrics**.

![Step 4: Formatted Multi-Line AI Report](/vague/Screenshot%202026-07-21%20145023.png)

* **Multi-Box Layout:** Separate card container for each numbered point (`1.`, `2.`, `3.`, `4.`, `5.`, `6.`, `7.`, `8.`).
* **Heading Styling:** Purplish tint background (`text-purple-300 bg-purple-950/80 border-purple-700/50`).
* **Metric Styling:** Emerald green background (`text-emerald-400 bg-emerald-950/70 border-emerald-700/40`).

---

## 2. Decision Matrix: Vague Ideas vs. Good Ideas

| Evaluation Criterion | Vague / Gibberish Pitch ❌ | Coherent Manufacturing Blueprint ✅ |
| :--- | :--- | :--- |
| **Title Example** | `fgbfg`, `asdfgh`, `test1`, `thing` | `Biodegradable Mycelium Packaging Crates` |
| **Description Example** | `ghfnghj`, `it makes money fast` | `Molded mushroom mycelium insulation packaging grown from local agricultural crop waste.` |
| **Validation Decision** | **REJECT & SHIELD** | **PASS TO DUAL AI ENGINE (Groq / Gemini)** |
| **Feasibility Score** | **`0 / 100`** | **`75 - 95 / 100`** |
| **Rating Label** | **`Non-Viable / Invalid Input`** | **`Highly Viable`** |
| **Financial COGS & MSRP** | Defaulted to **`₹0`** | Calculated in **`₹ INR`** (e.g. COGS ₹450, MSRP ₹1,899) |
| **Payback Horizon** | **`Never`** | **`6 Months to 3.5 Years`** |
| **Bill of Materials (BOM)** | `Unparsed / Gibberish Input (₹0)` | Structural Enclosures (₹180), Microcontrollers (₹220) |

---

## 3. Input Shield Algorithm (`lib/validation.ts`)

```typescript
export function checkIsGibberish(title: string, desc: string): boolean {
  const cleanTitle = title.trim().toLowerCase();
  const cleanDesc = desc.trim().toLowerCase();

  // 1. Length Threshold Check
  if (cleanTitle.length < 3 || cleanDesc.length < 5) return true;

  // 2. Keyboard Mashes & Repetitive Pattern Regex
  const mashRegex = /(?:[bcdfghjklmnpqrstvwxyz]{6,}|[aeiou]{5,}|fgbfg|ghfng|asdf|qwerty|zxcv|1234|test1|abcd)/i;
  if (mashRegex.test(cleanTitle) || mashRegex.test(cleanDesc)) return true;

  // 3. Vowel-to-Consonant Ratio Analysis
  const titleVowels = (cleanTitle.match(/[aeiou]/gi) || []).length;
  if (cleanTitle.length >= 5 && titleVowels === 0) return true;

  return false;
}
```

---

## 4. Response Output Comparison

### ❌ Rejected Vague Input Output (`Score: 0 / 100`)
```json
{
  "feasibilityScore": 0,
  "ratingLabel": "Non-Viable / Invalid Input",
  "verdict": "Concept 'fgbfg' rejected. Gibberish or unparseable input provided.",
  "detailedAnalysis": "1. **Invalid Pitch & Missing Context**: The submitted product title ('fgbfg') or description ('ghfnghj') contains unparseable keyboard mashes or nonsensical input. No viable manufacturing analysis can be performed for invalid inputs.\n\n2. **Zero Financial Viability**: Unit economics, Bill of Materials, and margin targets are defaulted to ₹0.",
  "financialViability": {
    "estimatedCogs": "₹0",
    "projectedMargin": "0%",
    "breakEvenMonths": "Never",
    "recommendedRetailPrice": "₹0"
  }
}
```

### ✅ Evaluated Coherent Input Output (`Score: 88 / 100`)
```json
{
  "feasibilityScore": 88,
  "ratingLabel": "Highly Viable",
  "verdict": "Strong market feasibility in Indian Rupees (₹).",
  "detailedAnalysis": "1. **Market Demand**: The demand for eco-friendly agricultural packaging is surging across Tier-1 Indian logistics hubs.\n\n2. **Unit Economics & Margin Target**: Estimated COGS is projected at **₹450 - ₹850 per unit** with MSRP of **₹1,899 - ₹2,999**, yielding **68% gross margin**.",
  "financialViability": {
    "estimatedCogs": "₹450 - ₹850 per unit",
    "projectedMargin": "68%",
    "breakEvenMonths": "14 Months",
    "recommendedRetailPrice": "₹1,899 - ₹2,999"
  }
}
```
