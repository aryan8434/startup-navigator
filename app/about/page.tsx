"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Server, Database, BrainCircuit, ShieldAlert, Cpu, ArrowDown } from "lucide-react";

export default function About() {
  return (
    <>
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="text-center mb-16">
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-white animate-fade-in">
            About <span className="text-gradient">Startup Navigator</span>
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
            A comprehensive guide and intelligence engine designed to speed up the launch lifecycle of early-stage software companies.
          </p>
        </div>

        {/* Mission Statement */}
        <section className="mb-20 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="text-left space-y-4">
            <h2 className="text-2xl font-bold text-white">Our Mission</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Founding a business is an exercise in extreme uncertainty. Entrepreneurs are required to master law, hiring, taxation, brand design, and growth metrics simultaneously.
            </p>
            <p className="text-slate-300 text-sm leading-relaxed">
              Startup Navigator consolidates these complex vectors into structured handbooks, checklists, and templates, while employing a localized Retrieval-Augmented Generation (RAG) AI to parse details instantly.
            </p>
          </div>
          <div className="p-8 rounded-2xl glassmorphism bg-indigo-950/10 border border-indigo-900/30 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl"></div>
            <BrainCircuit className="h-16 w-16 text-indigo-400 mx-auto mb-4 animate-pulse" />
            <h4 className="font-semibold text-white">Interactive AI Interface</h4>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Query questions safely. All matches reference source manuals, reducing hallucinations and providing verifiable citations.
            </p>
          </div>
        </section>

        {/* System Architecture Diagram */}
        <section className="mb-20 text-center">
          <h2 className="text-2xl font-display font-bold text-white mb-2">
            System Architecture & Data Flows
          </h2>
          <p className="text-sm text-slate-400 mb-12 max-w-xl mx-auto">
            Our app runs a full-stack Next.js architecture with isolated API layers, file database storage, and a dual-channel search retriever.
          </p>

          {/* CSS visual diagram */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-stretch relative">
            
            {/* Box 1: Frontend */}
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col justify-between items-center text-center relative">
              <div className="p-3 bg-slate-950 rounded-xl border border-indigo-900/40 text-indigo-400">
                <Cpu className="h-6 w-6" />
              </div>
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-white">Client Interface</h4>
                <p className="text-[11px] text-slate-400 mt-2">Next.js responsive views: Explore topics, Resources list, AI chat screen, Admin panels</p>
              </div>
              <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-20 bg-indigo-600 p-1 rounded-full text-white text-[10px] uppercase font-bold px-1.5 py-0.5 scale-75">
                HTTP
              </div>
            </div>

            {/* Box 2: Middleware */}
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col justify-between items-center text-center relative">
              <div className="p-3 bg-slate-950 rounded-xl border border-amber-900/40 text-amber-400">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-white">Edge Middleware</h4>
                <p className="text-[11px] text-slate-400 mt-2">Cookie validation checks redirects users to login on protected dashboard/admin routes</p>
              </div>
            </div>

            {/* Box 3: API Layer */}
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col justify-between items-center text-center relative">
              <div className="p-3 bg-slate-950 rounded-xl border border-blue-900/40 text-blue-400">
                <Server className="h-6 w-6" />
              </div>
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-white">Backend Router</h4>
                <p className="text-[11px] text-slate-400 mt-2">Node.js Serverless routes handle JWT logic, stats aggregator, articles CRUD, and search histories</p>
              </div>
            </div>

            {/* Box 4: RAG Engine */}
            <div className="p-6 rounded-2xl bg-indigo-950/20 border border-indigo-900/40 flex flex-col justify-between items-center text-center relative">
              <div className="p-3 bg-slate-950 rounded-xl border border-indigo-500/30 text-indigo-400">
                <BrainCircuit className="h-6 w-6" />
              </div>
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-white">AI RAG Engine</h4>
                <p className="text-[11px] text-slate-400 mt-2">TF-IDF similarity analyzer, context loader, fallbacks to local extractive summarizing or LLMs</p>
              </div>
            </div>

            {/* Box 5: Database */}
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col justify-between items-center text-center relative">
              <div className="p-3 bg-slate-950 rounded-xl border border-emerald-900/40 text-emerald-400">
                <Database className="h-6 w-6" />
              </div>
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-white">JSON Files DB</h4>
                <p className="text-[11px] text-slate-400 mt-2">Transactional filesystem storage representing users, articles, search histories, resources</p>
              </div>
            </div>

          </div>
        </section>

        {/* Technical Stack detail */}
        <section className="p-8 rounded-2xl glassmorphism bg-slate-900/10 border border-slate-800 text-left">
          <h3 className="text-lg font-semibold text-white mb-4">Technical Stack & Design Standards</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm text-slate-400 leading-relaxed">
            <div>
              <strong className="text-white block mb-1">Architecture Pattern</strong>
              Next.js 14 App Router, Client/Server isolation, atomic file-based JSON database with write locks.
            </div>
            <div>
              <strong className="text-white block mb-1">RAG Engine Details</strong>
              Custom keyword tokenizer, stopword filtering, relative relevance weight scoring, extractive context parser, pluggable OpenAI/Gemini support.
            </div>
            <div>
              <strong className="text-white block mb-1">Design System</strong>
              Glassmorphism UI, custom Tailwind v4 tokens, responsive layouts, standard system fonts stack, and embedded visual flows.
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
