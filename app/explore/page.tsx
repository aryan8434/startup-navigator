"use client";

import { useEffect, useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ArticleCard from "@/components/ArticleCard";
import { Search, RotateCcw, HelpCircle } from "lucide-react";

interface Article {
  id: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  tags: string[];
  createdAt: string;
}

const CATEGORIES = [
  "All",
  "Company Registration",
  "Funding",
  "Legal Compliance",
  "Hiring",
  "Branding",
  "Marketing",
  "Taxation",
  "Fundraising",
  "AI Tools",
  "Business Growth"
];

export default function Explore() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    async function loadArticles() {
      try {
        const res = await fetch("/api/articles");
        if (res.ok) {
          const data = await res.json();
          setArticles(data.articles);
        }
      } catch (error) {
        console.error("Failed to load articles:", error);
      } finally {
        setLoading(false);
      }
    }
    loadArticles();
  }, []);

  // Compute category article counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: articles.length };
    articles.forEach((a) => {
      counts[a.category] = (counts[a.category] || 0) + 1;
    });
    return counts;
  }, [articles]);

  // Client side search and category filter
  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      const matchesCategory =
        selectedCategory === "All" ||
        article.category.toLowerCase() === selectedCategory.toLowerCase();
      
      const tokens = searchQuery.toLowerCase().trim().split(/\s+/);
      const matchesSearch = tokens.every(
        (token) =>
          article.title.toLowerCase().includes(token) ||
          article.summary.toLowerCase().includes(token) ||
          article.content.toLowerCase().includes(token) ||
          article.tags.some((tag) => tag.toLowerCase().includes(token))
      );

      return matchesCategory && matchesSearch;
    });
  }, [articles, selectedCategory, searchQuery]);

  return (
    <>
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-white">
            Explore <span className="text-gradient">Startup Handbooks</span>
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
            Deep dive into our expert-crafted checklists and guides to navigate business milestones.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-8 bg-slate-900/40 p-4 rounded-2xl border border-slate-800/60 glassmorphism">
          {/* Search Bar */}
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search guides by keywords, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm transition"
            />
          </div>

          {/* Reset Filters button */}
          {(searchQuery || selectedCategory !== "All") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
              className="flex items-center space-x-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset filters</span>
            </button>
          )}
        </div>

        {/* Categories Carousel / Filters */}
        <div className="flex flex-wrap gap-2 mb-10 pb-2 border-b border-slate-900">
          {CATEGORIES.map((category) => {
            const count = categoryCounts[category] || 0;
            // Only render categories that have items OR are "All"
            if (category !== "All" && count === 0) return null;

            const isSelected = selectedCategory === category;
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-xl text-xs font-medium border transition cursor-pointer ${
                  isSelected
                    ? "bg-indigo-600 border-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/10"
                    : "bg-slate-900/50 border-slate-800/60 text-slate-400 hover:text-white hover:border-slate-700"
                }`}
              >
                {category} <span className="opacity-60 ml-1">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Articles Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="h-72 rounded-2xl bg-slate-900/30 border border-slate-800/50 animate-pulse"
              ></div>
            ))}
          </div>
        ) : filteredArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-900/10 border border-slate-800/40 rounded-2xl p-8">
            <HelpCircle className="h-10 w-10 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white">No articles match your search</h3>
            <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto">
              We couldn&apos;t find any guides that match &quot;{searchQuery}&quot;. Try adjusting your keywords or category filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
              className="mt-6 px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl hover:text-white transition cursor-pointer text-sm"
            >
              Clear Search
            </button>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
