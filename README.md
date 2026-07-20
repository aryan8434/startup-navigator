# 🚀 Startup & Manufacturing Ideas Platform — Production Blueprint & AI Architecture

[![Next.js](https://img.shields.io/badge/Next.js-16.2.10-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Groq Cloud](https://img.shields.io/badge/Groq_Cloud-Llama_3.3_70B-orange?style=for-the-badge)](https://groq.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](https://opensource.org/licenses/MIT)

**Live Web Application:** [https://startup-navigator-taupe.vercel.app/](https://startup-navigator-taupe.vercel.app/)  
**GitHub Repository:** [https://github.com/aryan8434/startup-navigator](https://github.com/aryan8434/startup-navigator)

---

## 📌 CANDIDATE DECLARATION & AVAILABILITY

> [!IMPORTANT]
> **Candidate Status & Availability Declaration**
> * **Immediate Availability**: **YES — Available Immediately** (0 days notice period, can start immediately).
> * **Previous Salary on Paper**: **INR 6,50,000 / annum (6.5 LPA)** *(Adjustable / Open for discussion based on role evaluation)*.

---

## 🎯 EXECUTIVE ASSESSMENT SUMMARY

This full-stack production application has been engineered as a high-yield **Startup & Manufacturing Ideas Platform**, built to the benchmark standards of leading idea databases (**www.10000ideas.com** and **www.ideabrowser.com**). 

It empowers founders, industrial designers, hardware innovators, and micro-factory operators to evaluate physical product concepts, run unit economics simulations, inspect step-by-step Bill of Materials (BOM), and execute AI-powered feasibility audits.

---

## 🧠 PART 1: MASTER PROMPT ENGINEERING

```markdown
================================================================================
                    MASTER SYSTEM PROMPT & ARCHITECTURE SPEC
================================================================================

YOU ARE AN ELITE PRINCIPAL SOFTWARE ARCHITECT AND STARTUP CO-FOUNDER AI. 
YOUR OBJECTIVE IS TO BUILD A PRODUCTION-GRADE, FULL-STACK STARTUP & MANUFACTURING 
IDEAS EXPLORER AND FEASIBILITY EVALUATOR WEB APPLICATION.

### 1. CORE DOMAIN & USER ROLES
- TARGET USERS: Hardware founders, micro-factory operators, D2C brand builders, 
  SMB manufacturers, industrial designers, and venture investors.
- USER ROLES:
  1. Guest User: Browse ideas, search vector RAG, use cost calculator.
  2. Registered Founder: Upvote concepts, submit new ideas, run AI feasibility audits.
  3. Administrator: Moderate idea submissions, review search analytics, manage legal templates.

### 2. DATA SCHEMAS & ENTITIES (TypeScript / Prisma-compatible)
- Idea: id, title, slug, tagline, category, investmentTier, profitMargin, difficulty, 
  targetMarket, tam, sam, som, summary, problemStatement, proposedSolution, 
  manufacturingProcess[], billOfMaterials[], machineryNeeded[], unitEconomics{}, 
  regulatoryRequirements[], competitorLandscape[], growthPlaybook[], tags[], upvotes, featured.
- Article: id, title, content, category, summary, tags[], createdAt, updatedAt.
- Resource: id, title, description, type, fileUrl, category, createdAt.
- SearchLog: id, userId, query, answer, sources[], timestamp.

### 3. AI & RAG CAPABILITIES
- RAG SEARCH ENGINE: TF-IDF vector retrieval indexing title, body, and tags across 
  articles and manufacturing ideas.
- AI FEASIBILITY ENGINE: Accepts custom user pitches and computes 4-vector risk scores 
  (Technical Difficulty, Supply Chain Risk, Capital Intensity, Regulatory Barrier), 
  generates unit cost estimates, BOM outlines, and action plans.
- LLM FALLBACK: Supports Groq (Llama 3.3 70B), Gemini Pro, and OpenAI GPT-4o with 
  offline extractive RAG fallback when cloud API keys are absent.

### 4. UI/UX & STYLING GUIDELINES
- DESIGN SYSTEM: Modern dark mode aesthetic (`#020617`), glassmorphism cards, 
  curated color accents (Indigo `#6366f1`, Emerald `#10b981`, Purple `#a855f7`), 
  Tailwind CSS v4, dynamic hover states, responsive flex/grid layouts.

### 5. API ROUTES & SECURITY
- REST ENDPOINTS:
  - GET/POST `/api/ideas` (list, filter by tier/category/margin, submit new)
  - GET/DELETE `/api/ideas/[id]` (single blueprint details)
  - POST `/api/ideas/[id]/upvote` (upvote persistence)
  - POST `/api/feasibility` (AI feasibility audit engine)
  - GET `/api/stats` (analytics aggregator)
  - POST `/api/search` (vector RAG pipeline)
- SECURITY: JWT HttpOnly session cookies, sanitized query inputs, atomic temp file 
  locks for database writes.
================================================================================
```

---

## 📐 PART 2: REQUIREMENT ANALYSIS & SYSTEM ARCHITECTURE

### 🌐 System Architecture Flow & Mind Map

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          FOUNDER CLIENT INTERFACE                       │
│ ┌──────────────┐ ┌───────────────┐ ┌──────────────┐ ┌─────────────────┐ │
│ │Idea Explorer │ │ AI Feasibility│ │ Unit Cost    │ │  Resource Hub   │ │
│ │  (/ideas)    │ │ (/feasibility)│ │ (/calculator)│ │   (/resources)  │ │
│ └──────┬───────┘ └───────┬───────┘ └──────┬───────┘ └────────┬────────┘ │
└────────┼─────────────────┼────────────────┼──────────────────┼──────────┘
         │                 │                │                  │
         ▼                 ▼                ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         NEXT.JS 16 EDGE & REST API                      │
│ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌──────────────┐ │
│ │  GET/POST      │ │ POST           │ │ Financial      │ │ GET/POST     │ │
│ │  /api/ideas    │ │ /api/feasibility│ │ Simulation     │ │ /api/search  │ │
│ └──────┬─────────┘ └───────┬────────┘ └────────────────┘ └──────┬───────┘ │
└────────┼───────────────────┼────────────────────────────────────┼─────────┘
         │                   │                                    │
         ▼                   ▼                                    ▼
┌──────────────────────────────────────┐ ┌────────────────────────────────┐
│      JSON ATOMIC DATABASE ENGINE     │ │     PLUGGABLE RAG & LLM ENGINES│
│  - Users, Ideas, Articles, Resources │ │ - TF-IDF Vector Retrieval      │
│  - Upvote counters & Search Logs     │ │ - Groq Cloud Llama 3.3 (70B)   │
│  - Atomic temp lock file persistence │ │ - Local Extractive Fallback    │
└──────────────────────────────────────┘ └────────────────────────────────┘
```

### 🤖 AI Technology Justification Matrix

| AI Technology | Component / Feature | Justification & Business Value |
| :--- | :--- | :--- |
| **Large Language Models (LLMs)** | AI Feasibility Co-Founder & RAG Completion | Generates natural language risk matrix, executive verdicts, and customized action plans based on raw founder pitches. |
| **Retrieval-Augmented Generation (RAG)** | AI Knowledge Search (`/search`) | Prevents hallucination by extracting internal articles and manufacturing blueprints to cite exact sources. |
| **TF-IDF Vector Retrieval** | Offline RAG Engine (`lib/rag.ts`) | Enables 100% offline capability without cloud API key dependencies, saving API operational costs. |
| **Predictive Financial Analytics** | Unit Cost & ROI Calculator (`/calculator`) | Dynamically computes COGS, gross profit margins, break-even unit volumes, and tooling payback months. |
| **Recommendation Engine** | Multi-Faceted Idea Filters (`/ideas`) | Filters opportunities by Capex Tier (`<$10k`, `$50k-$250k`), profit margin, difficulty, and category. |

---

## 🎨 PART 3: UI/UX DESIGN SYSTEM SPECIFICATION

- **Color Palette**:
  - **Background**: Deep Space Dark Slate (`#020617`, `#0f172a`)
  - **Accent Colors**: Hyper-Indigo (`#6366f1`), Emerald Profit Green (`#10b981`), Electric Purple (`#a855f7`), Amber Warning (`#f59e0b`).
  - **Surfaces**: Glassmorphism translucent cards with `backdrop-blur-md` and subtle borders (`border-slate-800`).
- **Typography**: Clean sans-serif system font stack paired with tight display headings (`font-display font-extrabold`).
- **Interactive Elements**: Micro-animations on hover (`hover:-translate-y-1`), active upvote buttons, tabbed specification views, and real-time range sliders.

---

## 🛠️ PART 4: AI-ASSISTED DEVELOPMENT WORKFLOW

The application was constructed using an advanced AI-assisted pair-programming workflow:

1. **Prompt Iteration 1 (Architecture & Schema)**: Defined TypeScript interfaces for `Idea`, `UnitEconomics`, `BillOfMaterialItem`, and seed datasets.
2. **Prompt Iteration 2 (Database & REST APIs)**: Engineered atomic file-locking persistence in `lib/db.ts` to prevent race conditions during concurrent upvotes.
3. **Prompt Iteration 3 (UI Components & Pages)**: Built glassmorphic `IdeaCard`, `/ideas` multi-dimensional explorer, `/ideas/[id]` detail view, and `/feasibility` evaluator.
4. **Prompt Iteration 4 (Verification & Refinement)**: Executed Next.js production builds, resolved TypeScript strict type constraints, and validated API responses.

---

## 🧪 PART 5: TESTING & QUALITY ASSURANCE

### 1. Automated Integration Tests (`scripts/test-api.mjs`)
- Tested `db.ideas.findMany()` dataset retrieval.
- Tested single idea lookup by ID and URL-friendly Slug.
- Verified upvote state persistence and atomic write locks.
- Tested guide articles and resource catalog integrity.

### 2. Manual Verification Checklist
- [x] **Idea Explorer Filtering**: Filtered by category (GreenTech, Hardware, FMCG) and investment tier (`<$10k`).
- [x] **Upvote Functionality**: Clicked upvote buttons and verified optimistic UI update + database write.
- [x] **AI Feasibility Evaluator**: Submitted custom pitch and verified risk matrix generation.
- [x] **Manufacturing Cost Calculator**: Modified raw material cost and tooling capex sliders; confirmed live break-even calculations.
- [x] **Cross-Browser & Responsiveness**: Verified on Chrome, Firefox, Edge, and mobile viewports.

---

## ⚙️ PART 6: INSTALLATION & LOCAL SETUP

### 1. Clone & Install
```bash
git clone https://github.com/aryan8434/startup-navigator.git
cd startup-navigator
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Production Build Validation
```bash
npm run build
npm run start
```

---

## 🌐 PART 7: DEPLOYMENT GUIDE (Vercel / Netlify / Render)

### Live Application Link:
👉 **[https://startup-navigator-taupe.vercel.app/](https://startup-navigator-taupe.vercel.app/)**

### Step-by-Step Vercel Deployment:
1. Push your repository to GitHub: `git push origin main`.
2. Import repository into [Vercel Dashboard](https://vercel.com/new).
3. Set Framework Preset: **Next.js**.
4. (Optional) Add Environment Variable:
   - `GROQ_API_KEY`: *(Optional for LLM completions; falls back gracefully to extractive RAG if omitted)*.
5. Click **Deploy**. Vercel will automatically compile static and dynamic routes.

---

## 📞 CONTACT & SUBMISSION INFORMATION

* **Applicant**: Aryan
* **GitHub Repository**: [https://github.com/aryan8434/startup-navigator](https://github.com/aryan8434/startup-navigator)
* **Live App URL**: [https://startup-navigator-taupe.vercel.app/](https://startup-navigator-taupe.vercel.app/)
* **Immediate Availability**: Yes (0 days notice)
* **Previous Salary on Paper**: 6.5 LPA
