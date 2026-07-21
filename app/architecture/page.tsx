"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BrainCircuit, Cpu, Layers, Database, Server, Code2 } from "lucide-react";

export default function ArchitectureDocsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      {/* Hero Header */}
      <section className="relative border-b border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center space-x-2 rounded-full bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-400 border border-indigo-500/20 mb-4">
            <Cpu className="h-3.5 w-3.5" />
            <span>Technical Deep Dive & Architecture Docs</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight font-display">
            System Architecture & <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Vector Database Engine</span>
          </h1>

          <p className="mt-4 text-base md:text-lg text-slate-300 max-w-3xl mx-auto">
            Technical breakdown detailing how the Retrieval-Augmented Generation (RAG) vector database engine is deployed across features, and the complete Web Architecture of the platform.
          </p>
        </div>
      </section>

      {/* Main Content: Exactly 2 Sections */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-12 space-y-12">
        {/* SECTION 1: WHERE & HOW VECTOR DATABASE / RAG IS USED */}
        <section className="rounded-2xl border border-indigo-500/30 bg-slate-900/60 p-6 md:p-8 backdrop-blur-md">
          <div className="flex items-center space-x-3 mb-6">
            <div className="rounded-xl bg-purple-500/20 p-2 text-purple-400 border border-purple-500/30">
              <BrainCircuit className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white font-display">1. Where & How Vector Database / RAG is Used</h2>
              <p className="text-xs text-slate-400">Anatomy of our Retrieval-Augmented Generation pipeline across 4 key locations</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-1">Location 1: Vector Index Engine</span>
              <h3 className="text-base font-bold text-white">lib/rag.ts Engine</h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                The core RAG engine tokenizes user query strings, strips stopwords, builds a multi-weighted TF-IDF vector matrix (Title: 10x, Category: 8x, Tags: 5x, Content: 1.5x), and matches relevant articles & manufacturing ideas.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider block mb-1">Location 2: AI Knowledge Search</span>
              <h3 className="text-base font-bold text-white">/search & /api/search</h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                The chat search interface queries the vector index, retrieves top matching documents, and sends the context to <strong>Groq Llama 3.3 (70B)</strong> to compile cited, reference-supported answers.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-1">Location 3: Market Cap & Feasibility Grounding</span>
              <h3 className="text-base font-bold text-white">/feasibility & RAG Financial Benchmark Engine</h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                RAG retrieves sector benchmarks for TAM/SAM/SOM market caps, BOM component rates, and payback horizons in ₹ INR. This grounds LLM feasibility scores in verified industrial data, preventing hallucinations.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
              <span className="text-xs font-bold text-pink-400 uppercase tracking-wider block mb-1">Location 4: Idea Explorer Database</span>
              <h3 className="text-base font-bold text-white">/ideas & /ideas/[id]</h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Manufacturing ideas are converted into structured vector documents so founders can query manufacturing steps, machinery specs, and unit economics semantically.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 2: WEB ARCHITECTURE */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 md:p-8 backdrop-blur-md">
          <div className="flex items-center space-x-3 mb-6">
            <div className="rounded-xl bg-indigo-500/20 p-2 text-indigo-400 border border-indigo-500/30">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white font-display">2. Web Architecture & Data Flow</h2>
              <p className="text-xs text-slate-400">Complete end-to-end full-stack layout diagram</p>
            </div>
          </div>

          <pre className="bg-slate-950 text-emerald-400 p-5 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800 mb-6">
{`┌─────────────────────────────────────────────────────────────────────────┐
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
└──────────────────────────────────────┘ └────────────────────────────────┘`}
          </pre>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
            <div className="rounded-xl bg-slate-950 p-4 border border-slate-800">
              <h4 className="font-bold text-white mb-1">Frontend Layer</h4>
              <p className="text-slate-400">Next.js 16 App Router, React 19, Tailwind CSS v4, dynamic glassmorphic UI components, and real-time state management.</p>
            </div>
            <div className="rounded-xl bg-slate-950 p-4 border border-slate-800">
              <h4 className="font-bold text-white mb-1">Server API Routes</h4>
              <p className="text-slate-400">Edge proxy middleware, JWT cookie session authentication, sanitized request handling, and RESTful CRUD handlers.</p>
            </div>
            <div className="rounded-xl bg-slate-950 p-4 border border-slate-800">
              <h4 className="font-bold text-white mb-1">Database & RAG Core</h4>
              <p className="text-slate-400">Atomic temporary file-locking persistence (`lib/db.ts`) combined with multi-weighted TF-IDF vector search and Groq Llama 3.3 (70B).</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
