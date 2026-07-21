# NxtVenture — Technical Architecture & Technology Stack Specification

---

## 🛠️ Complete Technology Stack & System Components

| Layer | Technology Name | Role & Specification |
| :--- | :--- | :--- |
| **Frontend** | **Next.js 16 (App Router)** | Full-stack React framework utilizing Server & Client Components. |
| **UI & Styling** | **Tailwind CSS v4 & React 19** | Dark-mode glassmorphism styling (`Slate 950`), custom HSL color tokens, and `@media print` executive PDF engine. |
| **Icons & Typography** | **Lucide React & Google Fonts** | Lucide React Iconography with Google Fonts (*Inter* & *Outfit*). |
| **Backend** | **Next.js 16 Server API Routes** | RESTful JSON endpoints (`/api/feasibility`, `/api/ideas`, `/api/search`, `/api/articles`). |
| **Authentication** | **JWT & Bcrypt Cookie Auth** | Cookie-based session tokens with password hashing for security. |
| **Primary AI Engine** | **Groq Cloud Llama 3.3 (70B)** | High-speed generative inference engine (~0.3s latency) executing hardware audits and idea generation. |
| **Secondary AI Engine** | **Google Gemini 2.5 Flash** | Alternative free-tier LLM engine (under testing warning enabled). |
| **Fallback AI Engine** | **Offline Heuristic Rule Engine** | Offline manufacturing evaluation engine providing 100% uptime fallback. |
| **RAG Vector Engine** | **TF-IDF Multi-Weighted Vector Engine** | Custom vector similarity matching module (`lib/rag.ts`) with tokenization and stop-word filtering. |
| **Database (DB)** | **JSON Atomic Database (`data/db.json`)** | Persistence engine with temp-file locking queue (`DB_FILE.tmp`). |
| **Serverless DB Fallback** | **`memorySchema` In-Memory DB** | In-memory schema state fallback solving Vercel read-only filesystem (`EROFS`) constraints. |

---

## 📋 Executive Summary & Candidate Declarations

### Candidate Profile & Status
* **Immediate Availability:** **YES (0 Days Notice / Immediate Joiner)**
* **Previous Salary on Paper:** **6.5 LPA**
* **Live Published Application (Vercel):** [https://startup-navigator-taupe.vercel.app/](https://startup-navigator-taupe.vercel.app/)
* **GitHub Repository:** [https://github.com/aryan8434/startup-navigator](https://github.com/aryan8434/startup-navigator)

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
        ModelSelector -->|Groq Selected| GroqAPI["Groq Llama 3.3 (70B) (~0.3s High Speed)"]
        ModelSelector -->|Gemini Selected| GeminiAPI["Google Gemini 2.5 Flash (~2s Free Tier)"]
        GroqAPI -->|API Error / Timeout| GeminiAPI
        GeminiAPI -->|API Error / Timeout| RuleEngine["Offline Heuristic Rule Engine"]
    end

    GroqAPI --> FeasibilityReport["Structured Report Generator"]
    GeminiAPI --> FeasibilityReport
    RuleEngine --> FeasibilityReport

    FeasibilityReport -->|0-100 Score + 4-Vector Risk| ReportUI["AI Report View (Numbered 1-8 in ₹ INR)"]
    ReportUI -->|Print Command| PDFExport["Clean Executive PDF Export (@media print)"]
```
