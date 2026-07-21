"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import {
  BrainCircuit,
  Database,
  Cpu,
  Layers,
  ShieldCheck,
  Zap,
  BookOpen,
  Server,
  ArrowRight,
  ExternalLink,
  Code2,
} from "lucide-react";

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
            Comprehensive technical breakdown explaining how the Retrieval-Augmented Generation (RAG) vector index operates, how ideas and articles are embedded, and step-by-step Vercel deployment procedures.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-12 space-y-12">
        {/* SECTION 1: VERCEL DEPLOYMENT GUIDE */}
        <section className="rounded-2xl border border-indigo-500/30 bg-slate-900/60 p-6 md:p-8 backdrop-blur-md">
          <div className="flex items-center space-x-3 mb-6">
            <div className="rounded-xl bg-indigo-500/20 p-2 text-indigo-400 border border-indigo-500/30">
              <Server className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white font-display">How to Deploy to Vercel</h2>
              <p className="text-xs text-slate-400">Step-by-step guide for 1-click cloud production deployment</p>
            </div>
          </div>

          <div className="space-y-4 text-sm text-slate-300">
            <div className="rounded-xl bg-slate-950 p-4 border border-slate-800">
              <h3 className="font-bold text-white mb-1">Step 1: Push Repository to GitHub</h3>
              <p className="text-xs text-slate-400 mb-2">Ensure all your latest changes are pushed to your GitHub repository:</p>
              <pre className="bg-slate-900 text-indigo-300 p-3 rounded-lg text-xs font-mono overflow-x-auto">
                git add .{"\n"}
                git commit -m "Deploy production Startup Navigator with Groq RAG Engine"{"\n"}
                git push origin main
              </pre>
            </div>

            <div className="rounded-xl bg-slate-950 p-4 border border-slate-800">
              <h3 className="font-bold text-white mb-1">Step 2: Import into Vercel</h3>
              <ol className="list-decimal list-inside space-y-1 text-xs text-slate-300">
                <li>Log into your <a href="https://vercel.com/dashboard" target="_blank" rel="noreferrer" className="text-indigo-400 underline">Vercel Dashboard</a>.</li>
                <li>Click <strong>Add New... &gt; Project</strong> and select your GitHub repository <code className="text-purple-300">startup-navigator</code>.</li>
                <li>Select <strong>Next.js</strong> as the Framework Preset.</li>
              </ol>
            </div>

            <div className="rounded-xl bg-slate-950 p-4 border border-slate-800">
              <h3 className="font-bold text-white mb-1">Step 3: Set Environment Variables</h3>
              <p className="text-xs text-slate-400 mb-2">In the Vercel project configuration panel, add the following Environment Variables under <strong>Environment Variables</strong>:</p>
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-2">Variable Key</th>
                    <th className="p-2">Example Value</th>
                    <th className="p-2">Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  <tr>
                    <td className="p-2 font-mono text-indigo-300">GROQ_API_KEY</td>
                    <td className="p-2 font-mono text-slate-400">gsk_E7RJX5zspE2M...</td>
                    <td className="p-2">Enables Groq Llama 3.3 (70B) Generative RAG & Feasibility AI</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-mono text-indigo-300">JWT_SECRET</td>
                    <td className="p-2 font-mono text-slate-400">super_secret_key_2026</td>
                    <td className="p-2">Encrypts JWT user authentication session cookies</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="rounded-xl bg-slate-950 p-4 border border-slate-800">
              <h3 className="font-bold text-white mb-1">Step 4: Deploy & Verify</h3>
              <p className="text-xs text-slate-400">
                Click <strong>Deploy</strong>. Vercel will compile static assets and serverless function endpoints. Once built, your live application will be available at your custom Vercel domain!
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 2: WHERE & HOW VECTOR DATABASE / RAG IS USED */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 md:p-8 backdrop-blur-md">
          <div className="flex items-center space-x-3 mb-6">
            <div className="rounded-xl bg-purple-500/20 p-2 text-purple-400 border border-purple-500/30">
              <BrainCircuit className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white font-display">Where & How Vector Database / RAG is Used</h2>
              <p className="text-xs text-slate-400">Anatomy of our Retrieval-Augmented Generation pipeline</p>
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
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-1">Location 3: AI Feasibility Audit</span>
              <h3 className="text-base font-bold text-white">/feasibility & /api/feasibility</h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Evaluates founder product pitches against manufacturing sector parameters, computing 4-vector risk matrices, unit cost estimates, BOM outlines, and action items using Groq LLM JSON output.
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

        {/* SECTION 3: SYSTEM ARCHITECTURE SPECIFICATIONS */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 md:p-8 backdrop-blur-md">
          <h2 className="text-2xl font-bold text-white mb-4 font-display">Complete Web Architecture Diagram</h2>
          <pre className="bg-slate-950 text-emerald-400 p-5 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
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
        </section>
      </main>

      <Footer />
    </div>
  );
}
