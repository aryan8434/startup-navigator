"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import IdeaCard, { IdeaCardProps } from "@/components/IdeaCard";
import {
  Rocket,
  Search,
  BookOpen,
  Download,
  TrendingUp,
  BrainCircuit,
  ArrowRight,
  Boxes,
  Calculator,
  Plus,
  Sparkles,
  ShieldCheck,
  Factory,
} from "lucide-react";

interface Stats {
  totalArticles: number;
  totalResources: number;
  totalSearches: number;
  totalIdeas: number;
  totalUpvotes: number;
}

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [featuredIdeas, setFeaturedIdeas] = useState<IdeaCardProps[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsRes, ideasRes] = await Promise.all([
          fetch("/api/stats"),
          fetch("/api/ideas"),
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }
        if (ideasRes.ok) {
          const ideasData = await ideasRes.json();
          setFeaturedIdeas(ideasData.ideas.slice(0, 3));
        }
      } catch (error) {
        console.error("Error loading home page data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const featureCards = [
    {
      icon: Boxes,
      title: "Startup & Manufacturing Ideas Directory",
      desc: "Comprehensive database of hardware, FMCG, and micro-factory ideas modeled after 10000ideas.com and ideabrowser.com.",
      color: "text-indigo-400",
      href: "/ideas",
      badge: "Idea Catalog",
    },
    {
      icon: BrainCircuit,
      title: "AI Feasibility & Risk Co-Founder",
      desc: "Pitch custom manufacturing concepts and receive instant viability scoring, 4-vector risk assessments, and action plans.",
      color: "text-purple-400",
      href: "/feasibility",
      badge: "AI Powered",
    },
    {
      icon: Calculator,
      title: "Unit Cost & ROI Calculator",
      desc: "Simulate COGS, tooling mold payback schedules, gross margins, and monthly break-even unit volume.",
      color: "text-emerald-400",
      href: "/calculator",
      badge: "Interactive Tool",
    },
    {
      icon: Download,
      title: "Legal & BOM Resource Hub",
      desc: "Download contract manufacturing templates, patent NDAs, supplier quality checklists, and SAFE notes.",
      color: "text-pink-400",
      href: "/resources",
      badge: "Free Downloads",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-tr from-indigo-600/10 via-purple-600/10 to-pink-600/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center space-x-2 rounded-full bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-400 border border-indigo-500/20 mb-6 animate-pulse">
            <Sparkles className="h-4 w-4" />
            <span>Modeled on 10,000 Ideas & IdeaBrowser Standards</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white font-display max-w-5xl mx-auto leading-tight">
            Turn High-Yield <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Manufacturing & Startup Ideas</span> Into Production
          </h1>

          <p className="mt-6 max-w-3xl mx-auto text-lg md:text-xl text-slate-300 leading-relaxed">
            Discover vetted physical hardware blueprints, micro-factory plans, Unit Economics, Bill of Materials, and AI Feasibility Scoring built for modern entrepreneurs.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/ideas"
              className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 px-6 py-3.5 text-base font-bold text-white shadow-xl shadow-indigo-600/20 hover:opacity-95 transition-all duration-200"
            >
              <Boxes className="h-5 w-5" />
              <span>Explore Ideas Directory</span>
            </Link>

            <Link
              href="/feasibility"
              className="inline-flex items-center space-x-2 rounded-xl bg-slate-900 px-6 py-3.5 text-base font-semibold text-slate-200 hover:bg-slate-800 border border-slate-700 transition-all duration-200"
            >
              <BrainCircuit className="h-5 w-5 text-indigo-400" />
              <span>AI Feasibility Evaluator</span>
            </Link>
          </div>

          {/* Quick Stats Grid */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-md">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Manufacturing Ideas</span>
              <p className="text-3xl font-black text-white mt-1">{stats?.totalIdeas || 8}+</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-md">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Community Upvotes</span>
              <p className="text-3xl font-black text-indigo-400 mt-1">{stats?.totalUpvotes || 2200}+</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-md">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Execution Guides</span>
              <p className="text-3xl font-black text-purple-400 mt-1">{stats?.totalArticles || 10}+</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-md">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Legal Templates</span>
              <p className="text-3xl font-black text-emerald-400 mt-1">{stats?.totalResources || 6}+</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Spotlights Grid */}
      <section className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-4xl font-bold text-white font-display">
            The Complete AI-Powered Founder Ecosystem
          </h2>
          <p className="mt-2 text-slate-400 text-base max-w-2xl mx-auto">
            Everything required to validate, cost out, and launch physical hardware and startup ventures.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featureCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <Link
                key={idx}
                href={card.href}
                className="group relative rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md hover:border-slate-700 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="rounded-xl bg-slate-800/80 p-3 border border-slate-700">
                    <Icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                  <span className="text-[10px] font-bold text-indigo-300 bg-indigo-950 px-2.5 py-0.5 rounded-full border border-indigo-800/40">
                    {card.badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
                  {card.title}
                </h3>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  {card.desc}
                </p>
                <div className="mt-4 inline-flex items-center space-x-1 text-xs font-semibold text-indigo-400 group-hover:translate-x-1 transition-transform">
                  <span>Launch Tool</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured Manufacturing Ideas Showcase */}
      <section className="py-16 bg-slate-900/40 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
            <div>
              <div className="inline-flex items-center space-x-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
                <Factory className="h-4 w-4" />
                <span>Featured Spotlights</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white font-display">
                Top Manufacturing & Hardware Blueprints
              </h2>
            </div>
            <Link
              href="/ideas"
              className="inline-flex items-center space-x-2 rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 border border-slate-700 transition-colors"
            >
              <span>View All Blueprints</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-64 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredIdeas.map((idea) => (
                <IdeaCard key={idea.id} {...idea} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* RAG Search & Co-founder Spotlight */}
      <section className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-8 md:p-12 backdrop-blur-md flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl">
            <span className="inline-flex items-center space-x-2 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400 border border-indigo-500/20 mb-4">
              <BrainCircuit className="h-3.5 w-3.5" />
              <span>Pluggable RAG Search</span>
            </span>
            <h2 className="text-3xl font-extrabold text-white font-display">
              Have Specific Questions About Incorporation, SAFEs, or Manufacturing Taxes?
            </h2>
            <p className="mt-4 text-slate-300 text-sm md:text-base leading-relaxed">
              Our Vector Search RAG engine indexes internal handbooks to provide cited, reference-supported answers instantly. Uses Groq Llama 3.3 / OpenAI with extractive local fallback.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <Link
              href="/search"
              className="inline-flex items-center justify-center space-x-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 transition-colors"
            >
              <Search className="h-4 w-4" />
              <span>Ask AI Search</span>
            </Link>

            <Link
              href="/explore"
              className="inline-flex items-center justify-center space-x-2 rounded-xl bg-slate-800 px-6 py-3.5 text-sm font-semibold text-slate-200 hover:bg-slate-700 border border-slate-700 transition-colors"
            >
              <BookOpen className="h-4 w-4" />
              <span>Browse Guides</span>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
