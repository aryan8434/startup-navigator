"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ArticleCard from "@/components/ArticleCard";
import {
  Rocket,
  Search,
  BookOpen,
  Download,
  TrendingUp,
  CheckCircle,
  Users2,
  BrainCircuit,
  ArrowRight,
} from "lucide-react";

interface Stats {
  totalArticles: number;
  totalResources: number;
  totalSearches: number;
  categoryBreakdown: Record<string, number>;
}

interface Article {
  id: string;
  title: string;
  category: string;
  summary: string;
  tags: string[];
  createdAt: string;
}

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [featuredArticles, setFeaturedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsRes, articlesRes] = await Promise.all([
          fetch("/api/stats"),
          fetch("/api/articles"),
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }
        if (articlesRes.ok) {
          const articlesData = await articlesRes.json();
          // Take the top 3 latest articles
          setFeaturedArticles(articlesData.articles.slice(0, 3));
        }
      } catch (error) {
        console.error("Error loading home page data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const features = [
    {
      icon: BrainCircuit,
      title: "RAG AI Search",
      desc: "Instant answers sourced directly from our curated knowledge base with inline page citations.",
      color: "text-indigo-400",
      href: "/search",
    },
    {
      icon: BookOpen,
      title: "Curated Guides",
      desc: "10 core categories including company registration, compliance, taxation, and fundraising.",
      color: "text-emerald-400",
      href: "/explore",
    },
    {
      icon: Download,
      title: "Ready-To-Use Resources",
      desc: "Delaware incorporation packs, SAFE agreement drafts, financial models, and growth spreadsheets.",
      color: "text-pink-400",
      href: "/resources",
    },
  ];

  const topTiles = [
    {
      icon: Rocket,
      title: "Live on Vercel",
      desc: "Open the deployed production experience.",
      href: "https://startup-navigator-taupe.vercel.app/",
      external: true,
      accent: "from-indigo-500/20 via-slate-950 to-slate-900/80",
      iconColor: "text-indigo-400",
    },
    {
      icon: TrendingUp,
      title: "Fast Founder Flow",
      desc: "A focused path from research to launch.",
      href: "/explore",
      external: false,
      accent: "from-emerald-500/10 via-slate-950 to-slate-900/80",
      iconColor: "text-emerald-400",
    },
    {
      icon: CheckCircle,
      title: "Verified Guides",
      desc: "Practical handbooks and vetted startup resources.",
      href: "/resources",
      external: false,
      accent: "from-pink-500/10 via-slate-950 to-slate-900/80",
      iconColor: "text-pink-400",
    },
    {
      icon: Users2,
      title: "Built for Founders",
      desc: "Everything arranged for quick decisions and action.",
      href: "/about",
      external: false,
      accent: "from-amber-500/10 via-slate-950 to-slate-900/80",
      iconColor: "text-amber-400",
    },
  ];

  return (
    <>
      <Navbar />

      <main className="flex-grow">
        {/* Top Tiles */}
        <section className="border-b border-slate-900 bg-slate-950/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {topTiles.map((tile, i) => {
                const Icon = tile.icon;
                const TileTag = tile.external ? "a" : Link;
                const tileProps = tile.external
                  ? { href: tile.href, target: "_blank", rel: "noreferrer" }
                  : { href: tile.href };

                return (
                  <TileTag
                    key={tile.title}
                    {...tileProps}
                    className={`group relative overflow-hidden rounded-2xl border border-slate-800/80 bg-gradient-to-br ${tile.accent} p-5 text-left shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] transition duration-300 hover:-translate-y-1 hover:border-indigo-500/30 hover:shadow-[0_25px_80px_-20px_rgba(99,102,241,0.22)] ${i === 0 ? "md:col-span-2" : ""}`}
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_40%)] opacity-80" />
                    <div className="relative z-10 flex items-start justify-between gap-4">
                      <div>
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-slate-950/70 ${tile.iconColor}`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <h2 className="mt-4 text-lg font-semibold text-white group-hover:text-indigo-300 transition-colors">
                          {tile.title}
                        </h2>
                        <p className="mt-2 text-sm leading-relaxed text-slate-400 max-w-sm">
                          {tile.desc}
                        </p>
                      </div>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300">
                        {tile.external ? "Open" : "View"}
                      </span>
                    </div>
                  </TileTag>
                );
              })}
            </div>
          </div>
        </section>

        {/* Hero Section */}
        <section className="relative pt-20 pb-20 overflow-hidden">
          {/* Background decorative glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none glow-indigo"></div>
          <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] rounded-full bg-purple-500/10 blur-[80px] pointer-events-none glow-purple"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            {/* Tagline pill */}
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800/80 mb-8 animate-fade-in">
              <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-ping"></span>
              <span className="text-xs font-semibold text-indigo-400 tracking-wide uppercase">
                Your Growth Playbook Awaits
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold text-white leading-tight tracking-tight max-w-4xl mx-auto">
              Navigate the Complexity of{" "}
              <span className="text-gradient">Building Your Startup</span>
            </h1>

            {/* Sub-headline */}
            <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Unlock professional guides, download legal templates, and leverage
              our Retrieval-Augmented AI assistant to search verified local
              files.
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link
                href="/search"
                className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl btn-gradient shadow-lg"
              >
                <Search className="h-4.5 w-4.5" />
                <span>Ask AI Assistant</span>
              </Link>

              <Link
                href="/explore"
                className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white font-semibold rounded-xl border border-slate-800 transition duration-200"
              >
                <span>Browse Guides</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Core Value Props */}
        <section className="py-16 border-t border-slate-900 bg-slate-950/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <Link
                    key={i}
                    href={feature.href}
                    className="flex flex-col p-6 rounded-2xl glassmorphism-card bg-slate-950/20 text-left cursor-pointer group"
                  >
                    <div
                      className={`p-3 w-fit rounded-xl bg-slate-900 border border-slate-800/80 mb-5 ${feature.color}`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-indigo-400 transition-colors duration-200">
                      {feature.title}
                    </h3>
                    <p className="mt-2.5 text-sm text-slate-400 leading-relaxed">
                      {feature.desc}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Dashboard Snapshot Section */}
        <section className="py-16 border-t border-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-2">
              System Metrics & Analytics
            </h2>
            <p className="text-sm text-slate-400 mb-12">
              Real-time directory audit logs and user search query counters.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {/* Stat Card 1 */}
              <div className="p-6 rounded-2xl glassmorphism bg-slate-900/10 text-center border border-slate-800/50">
                <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                  Guides
                </p>
                <h3 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white">
                  {loading ? "..." : stats?.totalArticles || 0}
                </h3>
                <p className="mt-1 text-xs text-slate-500">10 core fields</p>
              </div>

              {/* Stat Card 2 */}
              <div className="p-6 rounded-2xl glassmorphism bg-slate-900/10 text-center border border-slate-800/50">
                <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  Resources
                </p>
                <h3 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white">
                  {loading ? "..." : stats?.totalResources || 0}
                </h3>
                <p className="mt-1 text-xs text-slate-500">Legal packages</p>
              </div>

              {/* Stat Card 3 */}
              <div className="p-6 rounded-2xl glassmorphism bg-slate-900/10 text-center border border-slate-800/50">
                <p className="text-xs font-semibold text-pink-400 uppercase tracking-wider">
                  AI Queries
                </p>
                <h3 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white">
                  {loading ? "..." : stats?.totalSearches || 0}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  RAG searches resolved
                </p>
              </div>

              {/* Stat Card 4 */}
              <div className="p-6 rounded-2xl glassmorphism bg-slate-900/10 text-center border border-slate-800/50">
                <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                  Platform Status
                </p>
                <h3 className="mt-2 text-3xl sm:text-4xl font-extrabold text-emerald-500 flex items-center justify-center">
                  100%
                </h3>
                <p className="mt-1 text-xs text-slate-500">Fully Operational</p>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Guides Section */}
        <section className="py-16 border-t border-slate-900 bg-slate-950/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12 gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-white">
                  Latest Curated Handbooks
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Read comprehensive documentation compiled by industry
                  specialists and legal professionals.
                </p>
              </div>
              <Link
                href="/explore"
                className="flex items-center space-x-1.5 text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <span>View all articles</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="h-64 rounded-2xl bg-slate-900/30 border border-slate-800/50 animate-pulse"
                  ></div>
                ))}
              </div>
            ) : featuredArticles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {featuredArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-500 py-12">
                No articles found in the database. Seeding may be running...
              </p>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
