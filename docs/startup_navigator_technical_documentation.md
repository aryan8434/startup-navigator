# NxtVenture — Technical Architecture & Vector Database Specification

---

## Vector Database Storage & Access Specification

### 1. Does the Vector DB Store Everything?
**YES.** The Retrieval-Augmented Generation (RAG) Vector Database in NxtVenture ([`lib/rag.ts`](file:///c:/Codes/assignments/startup-navigator/lib/rag.ts)) dynamically tokenizes and indexes all 4 core data entities:

- **Startup Knowledge Articles:** Company registration, SAFEs, Delaware filing, hiring equity, ESOPs, sales tax, and manufacturing lead times.
- **Manufacturing Idea Blueprints:** Seed ideas, user-submitted concepts, and AI-generated concepts.
- **AI Feasibility Audit Reports:** Numerical scores (0-100), verdicts, 4-vector risk matrices, COGS, MSRP pricing in INR, Bill of Materials, and 8-point detailed analyses.
- **Sector Market Caps & Benchmarks:** TAM/SAM/SOM market caps in INR Crores and regional supplier rates (Rajkot, Pune, Noida).

---

### 2. How to Access the Vector Database

| Access Method | Endpoint / Route | How to Use |
| :--- | :--- | :--- |
| **1. UI Search Bar** | [`/search`](https://startup-navigator-taupe.vercel.app/search) | Type any natural language question or idea title into the AI Search bar to trigger RAG vector retrieval. |
| **2. REST API Endpoint** | `POST /api/search` | Send JSON `{ "query": "your query", "aiModel": "groq" }` to retrieve vector matches programmatically. |
| **3. TypeScript Import** | [`lib/rag.ts`](file:///c:/Codes/assignments/startup-navigator/lib/rag.ts) | Call `executeRagSearch(query, preferredModel)` directly in any Next.js API route or Server Action. |

---

## Complete Technology Stack & System Components

| Layer | Technology Name | Role & Specification |
| :--- | :--- | :--- |
| **Frontend** | **Next.js 16 (App Router)** | Full-stack React framework utilizing Server & Client Components. |
| **UI & Styling** | **Tailwind CSS v4 & React 19** | Dark-mode glassmorphism styling (`Slate 950`), custom HSL color tokens, and `@media print` executive PDF engine. |
| **Icons & Typography** | **Lucide React & Google Fonts** | Lucide React Iconography with Google Fonts (*Inter* & *Outfit*). |
| **Backend** | **Next.js 16 Server API Routes** | RESTful JSON endpoints (`/api/feasibility`, `/api/ideas`, `/api/search`, `/api/articles`). |
| **Authentication** | **JWT & Bcrypt Cookie Auth** | Cookie-based session tokens with password hashing for security. |
| **AI Provider Router** | **`lib/providers.ts`** | Multi-provider router. Each provider declares a preference-ordered model list and the router falls through candidates, then providers, before reporting failure. A model that returns a hard 404 is remembered and skipped for the rest of the process. |
| **Primary AI Engine** | **Groq** | Candidates: `openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `qwen/qwen3.8-27b`. Measured ~0.5-5s depending on report length. |
| **Secondary AI Engine** | **Google Gemini** | Candidates: `gemini-3.5-flash`, `gemini-3.1-flash-lite`, `gemini-3.6-flash`. Used as the independent second opinion in consensus mode. |
| **Optional Third Engine** | **OpenAI** | Candidates: `gpt-4o-mini`, `gpt-4.1-mini`. Enabled only when `OPENAI_API_KEY` is set. |
| **Health Probe** | **`GET /api/health`** | Sends a real completion to every configured provider and reports which model answered plus its latency. Presence of an API key is never treated as proof a provider works. |
| **Live Evidence Layer** | **`lib/evidence.ts`** | Retrieves citable external data from Wikipedia, World Bank Open Data, Crossref, arXiv and Hacker News. No API keys. Each connector is independently timed out and query-relaxed; failures degrade the evidence pack rather than the request. |
| **Confidence Model** | **`lib/confidence.ts`** | Scores 0-100 how much the verdict should be trusted, from evidence volume, source authority, source diversity, cross-model agreement, pitch specificity, internal knowledge overlap and calibration against past assessments. Computed from observable facts, never asked of the model. |
| **Fallback AI Engine** | **Offline Extractive Engine** | Used for RAG search only. The feasibility evaluator does *not* fall back to invented numbers: if every provider fails it returns "Assessment Unavailable" with all figures marked *Not assessed* and confidence 0. |
| **RAG Vector Engine** | **TF-IDF Multi-Weighted Vector Engine** | Custom vector similarity matching module (`lib/rag.ts`) with tokenization and stop-word filtering. |
| **Database (DB)** | **JSON Atomic Database (`data/db.json`)** | Persistence engine with temp-file locking queue (`DB_FILE.tmp`). |
| **Serverless DB Fallback** | **`memorySchema` In-Memory DB** | In-memory schema state fallback solving Vercel read-only filesystem (`EROFS`) constraints. |

---

## Executive Summary & Candidate Declarations

### Candidate Profile & Status
- **Immediate Availability:** **YES (0 Days Notice / Immediate Joiner)**
- **Live Published Application (Vercel):** [https://startup-navigator-taupe.vercel.app/](https://startup-navigator-taupe.vercel.app/)
- **GitHub Repository:** [https://github.com/aryan8434/startup-navigator](https://github.com/aryan8434/startup-navigator)

---

## 1. Requirement Analysis

### 1.1 Target Users & User Persona Mapping
* **Hardware & Manufacturing Founders:** Calculate unit economics, sourcing lead times, and tooling capex in Indian Rupees (₹).
* **Early-Stage VCs & Angels:** Require standardized feasibility scorecards, 0-100 numerical scores, and risk matrices to audit incoming physical product pitch decks.
* **Industrial & Product Designers:** Automated Bill of Materials (BOM) outlines and assembly workflows to validate low-volume manufacturing runs.

---

## 2. System Architecture & Workflow

```mermaid
flowchart TD
    User([User / Founder]) -->|Browse Directory| Explorer[Idea Explorer /ideas]
    User -->|Submit Concept / Pitch| FeasibilityForm[AI Feasibility Evaluator /feasibility]
    User -->|Query Legal & SAFEs| RAGSearch[RAG AI Assistant /search]
    User -->|Simulate COGS & Payback| CostCalc[Unit Cost & ROI Calculator /calculator]

    subgraph RAG_Engine ["Retrieval-Augmented Generation Engine (lib/rag.ts)"]
        RAGSearch --> VectorSearch["TF-IDF / Vector Similarity Search"]
        VectorSearch --> LocalDB[("Market Caps, Sector Benchmarks & Legal Guides")]
    end

    subgraph Garbage_Validation ["Input Shield & Garbage Data Validator"]
        FeasibilityForm --> InputCheck{"Valid Product Concept?"}
        InputCheck -->|Nonsense / Keyboard Mashes| ZeroScore["Score: 0 / 100 (Non-Viable / Invalid Input)"]
        InputCheck -->|Coherent Concept| ModelSelector{"Selected AI Engine"}
    end

    subgraph Multi_AI_Engine ["Multi-Provider AI Execution Layer"]
        ModelSelector --> Evidence["Live Evidence Layer (lib/evidence.ts)"]
        Evidence --> Sources["Wikipedia · World Bank · Crossref · arXiv · Hacker News"]
        Sources --> GroqAPI["Groq (gpt-oss-120b, fallback chain)"]
        Sources --> GeminiAPI["Gemini (3.5-flash, fallback chain)"]
        GroqAPI -->|all candidates fail| Unavailable["Assessment Unavailable (no invented figures)"]
        GeminiAPI -->|all candidates fail| Unavailable
    end

    GroqAPI --> Reconcile["Reconcile: mean score, measure disagreement"]
    GeminiAPI --> Reconcile
    Reconcile --> Confidence["Confidence Model (lib/confidence.ts)"]
    Confidence --> FeasibilityReport["Structured Report Generator"]
    Unavailable --> FeasibilityReport

    FeasibilityReport -->|Feasibility 0-100 + Confidence 0-100 + cited sources| ReportUI["AI Report View (Numbered 1-8 in ₹ INR, inline [n] citations)"]
    ReportUI -->|Print Command| PDFExport["Clean Executive PDF Export (@media print)"]
```
