# NxtVenture — Vague vs. Coherent Startup Idea Validation Guide

This document outlines the classification framework, validation matrix, and prompt engineering directives used by **NxtVenture** to detect and score vague, nonsensical, or gibberish pitches versus production-ready manufacturing blueprints.

---

## 1. Validation Taxonomy & Classification Matrix

```
                          ┌──────────────────────────┐
                          │   Incoming Pitch Data    │
                          └────────────┬─────────────┘
                                       │
                         ┌─────────────┴─────────────┐
                         │ Input Validation Shield   │
                         │   (checkIsGibberish)      │
                         └─────────────┬─────────────┘
                                       │
            ┌──────────────────────────┴──────────────────────────┐
            │                                                     │
            ▼                                                     ▼
┌───────────────────────┐                             ┌───────────────────────┐
│   Vague / Gibberish   │                             │  Coherent / Valid     │
│   (Score: 0 / 100)    │                             │  (Score: 41 - 100)    │
└───────────┬───────────┘                             └───────────┬───────────┘
            │                                                     │
            ▼                                                     ▼
• Keyboard mashes (fgbfg, ghfnghj)                     • Detailed product specs
• Vowels = 0 or consonant ratio > 80%                  • Clear target audience & pricing
• Single-word non-product titles                       • Realistic Bill of Materials
• COGS = ₹0, Payback = Never                           • Formatted 8-point AI Report in ₹
```

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

## 3. Input Validation Shield Algorithm (`lib/validation.ts`)

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
