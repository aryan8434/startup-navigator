"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { PlusCircle, Sparkles, CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SubmitIdeaPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    tagline: "",
    category: "Manufacturing",
    investmentTier: "$10k - $50k",
    profitMargin: "50 - 65%",
    difficulty: "Intermediate",
    summary: "",
    problemStatement: "",
    proposedSolution: "",
    targetMarket: "",
    tam: "$1.5 Billion Global Market",
    tags: "manufacturing, startup",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.tagline) {
      setError("Title and tagline are required.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Submission failed");
      setSuccess(true);
      setTimeout(() => {
        router.push("/ideas");
      }, 2000);
    } catch (err) {
      setError("Failed to submit idea. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <section className="relative border-b border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <Link href="/ideas" className="inline-flex items-center space-x-1.5 text-xs text-indigo-400 hover:text-indigo-300 mb-4">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Explorer</span>
          </Link>
          <h1 className="text-3xl font-extrabold text-white font-display">Submit a Manufacturing or Startup Idea</h1>
          <p className="mt-2 text-slate-300 text-sm">
            Share your hardware, FMCG, or micro-factory innovation with the community.
          </p>
        </div>
      </section>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-10">
        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 md:p-8 backdrop-blur-md space-y-6">
          {error && <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-4 text-xs text-rose-300">{error}</div>}
          {success && (
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-xs font-semibold text-emerald-300 flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Idea submitted successfully! Redirecting to Idea Explorer...</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-white mb-2">Idea Title *</label>
            <input
              type="text"
              placeholder="e.g. Modular Cold-Plunge Chiller Manufacturing"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">One-Line Pitch / Tagline *</label>
            <input
              type="text"
              placeholder="e.g. Off-grid energy efficient cooling units for wellness spas and athletic centers."
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="Manufacturing">Manufacturing</option>
                <option value="Hardware / Electronics">Hardware / Electronics</option>
                <option value="GreenTech / Sustainability">GreenTech / Sustainability</option>
                <option value="FMCG / Consumer Goods">FMCG / Consumer Goods</option>
                <option value="BioTech / Healthcare">BioTech / Healthcare</option>
                <option value="Industrial Automation">Industrial Automation</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">Capex Investment Tier</label>
              <select
                value={formData.investmentTier}
                onChange={(e) => setFormData({ ...formData, investmentTier: e.target.value })}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="< $10k">&lt; $10k</option>
                <option value="$10k - $50k">$10k - $50k</option>
                <option value="$50k - $250k">$50k - $250k</option>
                <option value="$250k+">$250k+</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">Problem Statement</label>
            <textarea
              rows={3}
              placeholder="What current market friction or waste does this solve?"
              value={formData.problemStatement}
              onChange={(e) => setFormData({ ...formData, problemStatement: e.target.value })}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">Proposed Manufacturing Solution</label>
            <textarea
              rows={3}
              placeholder="How will it be produced and distributed?"
              value={formData.proposedSolution}
              onChange={(e) => setFormData({ ...formData, proposedSolution: e.target.value })}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-colors disabled:opacity-50"
          >
            {loading ? "Publishing Idea Blueprint..." : "Publish Idea Blueprint"}
          </button>
        </form>
      </main>

      <Footer />
    </div>
  );
}
