# 🚀 Startup Navigator — Full-Stack AI-Powered Founder Hub

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Groq](https://img.shields.io/badge/Groq_Cloud-Llama_3.3-orange?style=for-the-badge)](https://groq.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](https://opensource.org/licenses/MIT)

**Startup Navigator** is a comprehensive full-stack platform designed to steer entrepreneurs through critical corporate milestones. It provides interactive, curated manuals across company registration, equity divisions, funding, taxation, legal compliance, branding, marketing, hiring, and business growth.

Using an advanced **Retrieval-Augmented Generation (RAG)** pipeline, the platform allows founders to query internal guides and receive cited, reference-supported answers instantly.

---

## ✨ Core Features

*   **🔍 Pluggable RAG AI Search (`/search`)**: Chat-style search interface querying local files. It maps query vectors to relevant guides and generates referenced answers citing sources.
*   **📚 Curated Guides Hub (`/explore`)**: Categorized handbooks covering 10 core startup vectors (LLCs vs C-Corps, tax nexus rules, SAFEs, Sean Ellis PMF testing, etc.) with real-time text filters.
*   **📁 Dynamic Resource Repository (`/resources`)**: Automatic legal template generator allowing founders to download custom NDAs, post-money SAFEs, vesting agreements, and financial spreadsheets.
*   **📊 Founder Analytics Dashboard (`/dashboard`)**: Personal founder center mapping stats, topics count, and a toggle-expandable audit logs history of all past AI searches.
*   **🛡️ Administrative Control Panel (`/admin`)**: Single-page administrative dashboard tracking total users, top search keywords, and full CRUD interfaces to create, update, or delete articles and download templates.
*   **🔒 Secure Session Auth (`/login` / `/register`)**: Cookie-persisted sessions using JWT encryption and edge-compatible middleware guarding protected routes.

---

## 💼 Why Startup Navigator is Vital for Businesses

Launching a software company is an exercise in extreme administrative complexity. Founders must act as lawyers, HR managers, tax advisors, and designers simultaneously. Startup Navigator mitigates this burden:

1.  **Reduces Legal Friction**: Explains vesting schedules, intellectual property assignments, and Delaware incorporation structures to prevent early-stage cap table errors.
2.  **Mitigates Tax Audits**: Simplifies sales tax nexus (Wayfair decision criteria) and guides SaaS companies on R&D tax credit claims.
3.  **Boosts Execution Speed**: Provides ready-to-run legal template packs, safe agreements, and financial sheets, bypassing expensive advisory fees.
4.  **Preserves IP Assets**: Explains key IP assignment clauses, copyright protections, and contractor classifications to keep the company investor-ready.

---

## 🏗️ Premium Architectural Layout

The platform uses a decoupled, serverless-ready architecture optimized for performance and zero-trust security:

```
┌────────────────────────────────────────────────────────┐
│                     Client Views                       │
│    (Home, Explore, AI Search, Resources, Dashboards)    │
└───────────────────────────┬────────────────────────────┘
                            │ (HTTP Requests)
                            ▼
┌────────────────────────────────────────────────────────┐
│                   Edge Proxy Guard                     │
│          (JWT Verification & Route Redirects)          │
└───────────────────────────┬────────────────────────────┘
                            │ (Node.js Server Runtime)
                            ▼
┌────────────────────────────────────────────────────────┐
│               REST API Server Routes                   │
│   (Register, Login, CRUD Handlers, Stats Aggregator)   │
└─────────────┬─────────────────────────────┬────────────┘
              │ (Query Read/Write)          │ (Vector Context)
              ▼                             ▼
┌───────────────────────────┐ ┌──────────────────────────┐
│      Prisma DB Layer      │ │      RAG Search Engine   │
│   (Concurrent-safe local  │ │   (TF-IDF Vector Index,  │
│    database transactions) │ │   Groq/OpenAI Cloud API) │
└───────────────────────────┘ └──────────────────────────┘
```

### ⚡ Vector Retrieval & RAG Pipeline
*   **Vector Embeddings**: Queries are tokenized, stripped of stopwords, and indexed using a TF-IDF weight matrix to create semantic query vectors.
*   **Document Retrieval**: These vectors are matched against document category, tags, title, and body indexes, sorting them by relative relevance scores.
*   **Generative Completion**: The top 3 matching guide segments are combined as system context and sent to the LLM (e.g. Groq Llama 3.3) to compile a structured answer.
*   **Offline Extractive Fallback**: If LLM Cloud keys are missing, the engine runs an extractive summarizer to pull direct paragraph quotes and cite source guides.

### 💾 Transactional Data Storage
The database is structured using standard repository patterns:
*   **Prisma SQLite Engine**: Leverages relational schemas for users, articles, search histories, and templates.
*   **Atomic Transactions**: Protects file writes using atomic temporary locks, making the local workspace safe from database corruption during concurrent operations.

---

## 🤖 Groq LLM Support

We natively support **Groq Cloud** API completions, utilizing their flagship **Llama 3.3 (70B) Versatile** model for high-speed, expert reasoning. 
*   **Is a Groq API Key required?**
    **No.** If no API keys are provided in the configuration, the system automatically falls back to our local extractive RAG summary engine. This ensures the app is **100% operational out of the box** with zero setup costs.
*   If you *do* want generative responses, simply get a free key from the [Groq Console](https://console.groq.com/) and paste it into your `.env` file as `GROQ_API_KEY`.

---

## ⚙️ Installation & Local Setup

Follow these simple steps to run the complete platform on your system:

### 1. Clone & Extract
```bash
git clone https://github.com/aryan8434/startup-navigator.git
cd startup-navigator
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in the root directory (you can copy the provided `.env.example`):
```bash
cp .env.example .env
```
Inside your `.env` file, configure your variables:
```env
# Secret key used for signing session cookies
JWT_SECRET=generate_any_secure_random_string_here

# Pluggable LLM Providers (Configure Groq to query Llama 3.3)
GROQ_API_KEY=your_groq_api_key_here
GEMINI_API_KEY=
OPENAI_API_KEY=
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

### 5. Compile Production Build
Ensure compliance and verify code compiling:
```bash
npm run build
```

---

## 🔐 Credentials & Access Control

*   **How to gain Admin Privileges:**
    The **very first** user registered on the registration screen (`/register`) is automatically designated as an **Admin**.
*   **Alternative Admin signup:**
    Any user registered with an email starting with the prefix `admin` (e.g., `admin@company.com`, `admin-test@corp.com`) will bypass normal rules and receive full `admin` credentials.
*   Admins gain access to the dynamic `/admin` CRUD panels and system audit logs. Regular users are directed to the founder `/dashboard`.
