"use client";

import { useState } from "react";
import Link from "next/link";
import { ThumbsUp, DollarSign, TrendingUp, Layers, ArrowRight, Zap, CheckCircle2 } from "lucide-react";

export interface IdeaCardProps {
  id: string;
  title: string;
  slug: string;
  tagline: string;
  category: string;
  investmentTier: string;
  profitMargin: string;
  difficulty: string;
  tam: string;
  upvotes: number;
  featured?: boolean;
}

export default function IdeaCard({
  id,
  title,
  slug,
  tagline,
  category,
  investmentTier,
  profitMargin,
  difficulty,
  tam,
  upvotes: initialUpvotes,
  featured = false,
}: IdeaCardProps) {
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [upvoted, setUpvoted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpvote = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (upvoted || loading) return;

    setUpvoted(true);
    setUpvotes((prev) => prev + 1);
    setLoading(true);

    try {
      await fetch(`/api/ideas/${id}/upvote`, { method: "POST" });
    } catch (err) {
      console.error("Upvote failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff.toLowerCase()) {
      case "beginner":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "intermediate":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "advanced":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "expert":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  return (
    <div
      className={`group relative rounded-2xl border bg-slate-900/60 p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 ${
        featured ? "border-indigo-500/40 ring-1 ring-indigo-500/30" : "border-slate-800 hover:border-slate-700"
      }`}
    >
      {featured && (
        <div className="absolute -top-3 left-6 inline-flex items-center space-x-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 px-3 py-0.5 text-xs font-semibold text-white shadow-md">
          <Zap className="h-3 w-3 fill-current" />
          <span>Featured Spotlight</span>
        </div>
      )}

      {/* Category & Badges Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <span className="inline-flex items-center rounded-lg bg-indigo-950/80 px-2.5 py-1 text-xs font-medium text-indigo-300 border border-indigo-800/40">
          {category}
        </span>
        <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium border ${getDifficultyColor(difficulty)}`}>
          {difficulty}
        </span>
      </div>

      {/* Title & Tagline */}
      <Link href={`/ideas/${id}`}>
        <h3 className="text-xl font-bold tracking-tight text-white group-hover:text-indigo-400 transition-colors duration-200 line-clamp-2">
          {title}
        </h3>
      </Link>
      <p className="mt-2 text-sm text-slate-300 line-clamp-2 leading-relaxed">
        {tagline}
      </p>

      {/* Grid Specs */}
      <div className="mt-5 grid grid-cols-2 gap-3 border-y border-slate-800/80 py-3 text-xs text-slate-300">
        <div className="flex items-center space-x-1.5">
          <DollarSign className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>Capex: <strong className="text-slate-100">{investmentTier}</strong></span>
        </div>
        <div className="flex items-center space-x-1.5">
          <TrendingUp className="h-4 w-4 text-purple-400 shrink-0" />
          <span>Margin: <strong className="text-slate-100">{profitMargin}</strong></span>
        </div>
        <div className="flex items-center space-x-1.5 col-span-2">
          <Layers className="h-4 w-4 text-indigo-400 shrink-0" />
          <span className="truncate">TAM: <strong className="text-slate-100">{tam}</strong></span>
        </div>
      </div>

      {/* Actions & Upvotes */}
      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={handleUpvote}
          disabled={upvoted}
          className={`inline-flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
            upvoted
              ? "bg-indigo-600 text-white cursor-default"
              : "bg-slate-800/80 text-slate-300 hover:bg-indigo-600/20 hover:text-indigo-300 border border-slate-700"
          }`}
        >
          <ThumbsUp className={`h-3.5 w-3.5 ${upvoted ? "fill-current" : ""}`} />
          <span>{upvotes}</span>
        </button>

        <Link
          href={`/ideas/${id}`}
          className="inline-flex items-center space-x-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 group-hover:translate-x-0.5 transition-all duration-200"
        >
          <span>View Blueprint</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
