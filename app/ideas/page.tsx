"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import IdeaCard, { IdeaCardProps } from "@/components/IdeaCard";
import { Search, Filter, RotateCcw, Plus, BrainCircuit, Calculator, Sparkles } from "lucide-react";

const CATEGORIES = [
  "All",
  "Manufacturing",
  "Hardware / Electronics",
  "GreenTech / Sustainability",
  "FMCG / Consumer Goods",
  "BioTech / Healthcare",
  "Industrial Automation",
];

const INVESTMENT_TIERS = [
  "All",
  "< $10k",
  "$10k - $50k",
  "$50k - $250k",
  "$250k+",
];

const DIFFICULTIES = ["All", "Beginner", "Intermediate", "Advanced", "Expert"];

export default function IdeasExplorer() {
  const [ideas, setIdeas] = useState<IdeaCardProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedTier, setSelectedTier] = useState("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [sortBy, setSortBy] = useState("upvotes");

  useEffect(() => {
    async function loadIdeas() {
      try {
        const res = await fetch("/api/ideas");
        if (res.ok) {
          const data = await res.json();
          setIdeas(data.ideas);
        }
      } catch (error) {
        console.error("Failed to load ideas:", error);
      } finally {
        setLoading(false);
      }
    }
    loadIdeas();
  }, []);

  const filteredIdeas = useMemo(() => {
    return ideas
      .filter((idea) => {
        const matchesCategory =
          selectedCategory === "All" ||
          idea.category.toLowerCase() === selectedCategory.toLowerCase();
        const matchesTier =
          selectedTier === "All" || idea.investmentTier === selectedTier;
        const matchesDifficulty =
          selectedDifficulty === "All" ||
          idea.difficulty.toLowerCase() === selectedDifficulty.toLowerCase();
        const matchesSearch =
          !searchQuery.trim() ||
          idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          idea.tagline.toLowerCase().includes(searchQuery.toLowerCase());

        return (
          matchesCategory && matchesTier && matchesDifficulty && matchesSearch
        );
      })
      .sort((a, b) => {
        if (sortBy === "upvotes") return b.upvotes - a.upvotes;
        if (sortBy === "margin") return b.profitMargin.localeCompare(a.profitMargin);
        return 0;
      });
  }, [ideas, selectedCategory, selectedTier, selectedDifficulty, searchQuery, sortBy]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
    setSelectedTier("All");
    setSelectedDifficulty("All");
    setSortBy("upvotes");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      {/* Header Banner */}
      <section className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 py-12 md:py-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950/50 to-transparent pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center space-x-2 rounded-full bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-400 border border-indigo-500/20 mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            <span>10,000 Ideas & IdeaBrowser Standard Directory</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white font-display">
            Startup & Manufacturing <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Idea Explorer</span>
          </h1>

          <p className="mt-4 max-w-2xl mx-auto text-base md:text-lg text-slate-300">
            Browse high-yield manufacturing opportunities, hardware innovations, and micro-factory blueprints complete with Unit Economics, Bill of Materials, and AI Feasibility ratings.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/feasibility"
              className="inline-flex items-center space-x-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-all duration-200 shadow-lg shadow-indigo-600/20"
            >
              <BrainCircuit className="h-4 w-4" />
              <span>AI Feasibility Audit</span>
            </Link>

            <Link
              href="/calculator"
              className="inline-flex items-center space-x-2 rounded-xl bg-slate-800 px-5 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-700 transition-all duration-200 border border-slate-700"
            >
              <Calculator className="h-4 w-4 text-purple-400" />
              <span>Unit Cost Calculator</span>
            </Link>

            <Link
              href="/submit-idea"
              className="inline-flex items-center space-x-2 rounded-xl bg-emerald-600/20 px-5 py-2.5 text-sm font-semibold text-emerald-400 hover:bg-emerald-600/30 transition-all duration-200 border border-emerald-500/30"
            >
              <Plus className="h-4 w-4" />
              <span>Submit An Idea</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content & Filters */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Search & Main Selectors */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search manufacturing ideas, keywords, or components..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl bg-slate-900/90 pl-10 pr-4 py-3 text-sm text-white placeholder-slate-400 border border-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>

          {/* Sort dropdown */}
          <div className="flex items-center space-x-3">
            <label className="text-xs font-medium text-slate-400 shrink-0">Sort By:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2.5 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
            >
              <option value="upvotes">Most Upvoted</option>
              <option value="margin">Highest Profit Margin</option>
            </select>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 backdrop-blur-md mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2 text-sm font-semibold text-white">
              <Filter className="h-4 w-4 text-indigo-400" />
              <span>Multi-Dimensional Filters</span>
            </div>
            {(selectedCategory !== "All" || selectedTier !== "All" || selectedDifficulty !== "All" || searchQuery) && (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center space-x-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Capex Tier */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Investment Tier (Capex)</label>
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
              >
                {INVESTMENT_TIERS.map((tier) => (
                  <option key={tier} value={tier}>{tier}</option>
                ))}
              </select>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Execution Complexity</label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
              >
                {DIFFICULTIES.map((diff) => (
                  <option key={diff} value={diff}>{diff}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-12">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-64 rounded-2xl bg-slate-900/40 border border-slate-800 animate-pulse" />
            ))}
          </div>
        ) : filteredIdeas.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-slate-800 bg-slate-900/20">
            <p className="text-lg font-semibold text-slate-300">No ideas found matching your criteria</p>
            <p className="text-sm text-slate-400 mt-1">Try adjusting your category, investment tier, or search query.</p>
            <button
              onClick={handleResetFilters}
              className="mt-4 inline-flex items-center space-x-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset All Filters</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredIdeas.map((idea) => (
              <IdeaCard key={idea.id} {...idea} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
