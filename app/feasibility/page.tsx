"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  BrainCircuit,
  Sparkles,
  CheckCircle2,
  Boxes,
  TrendingUp,
  ShieldAlert,
  RotateCcw,
  Zap,
  Clock,
  FileText,
  Download,
} from "lucide-react";

interface AssessmentReport {
  title: string;
  category: string;
  feasibilityScore: number;
  ratingLabel: string;
  verdict: string;
  detailedAnalysis?: string;
  aiProviderUsed?: string;
  riskMatrix: {
    technicalComplexity: string;
    supplyChainRisk: string;
    capitalIntensity: string;
    regulatoryBarrier: string;
  };
  financialViability: {
    estimatedCogs: string;
    projectedMargin: string;
    breakEvenMonths: string;
    recommendedRetailPrice: string;
  };
  billOfMaterials: { item: string; estimatedCost: string }[];
  actionPlan: string[];
}

export default function FeasibilityPage() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Manufacturing",
    investmentTier: "₹5 Lakhs - ₹25 Lakhs",
    targetMarket: "", // Placeholder only
    aiModel: "groq", // "groq" (fast) or "gemini" (slower free tier)
  });

  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<AssessmentReport | null>(null);
  const [error, setError] = useState("");

  // Parse query parameters when transferring data from idea detail page
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const title = params.get("title");
      const category = params.get("category");
      const tier = params.get("tier");
      const targetMarket = params.get("targetMarket");
      const description = params.get("description");

      if (title || description) {
        setFormData((prev) => ({
          ...prev,
          title: title || prev.title,
          category: category || prev.category,
          investmentTier: tier || prev.investmentTier,
          targetMarket: targetMarket || prev.targetMarket,
          description: description || prev.description,
        }));
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      setError("Please fill out the concept title and detailed description.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/feasibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          targetMarket: formData.targetMarket || "D2C & B2B Customers",
        }),
      });

      if (!res.ok) throw new Error("Assessment failed");
      const data = await res.json();
      setReport(data.report);
    } catch (err) {
      setError("Failed to run AI Feasibility Audit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Helper to format numbered report points with bold text and colored highlights
  const renderFormattedReport = (rawText: string) => {
    const lines = rawText.split(/\n+/).filter((l) => l.trim().length > 0);

    return (
      <div className="space-y-4">
        {lines.map((line, idx) => {
          const match = line.match(/^(\d+[\.\)])\s*(.*)/);
          const num = match ? match[1] : `${idx + 1}.`;
          const content = match ? match[2] : line;

          const parts = content.split(/(\*\*.*?\*\*)/);

          return (
            <div key={idx} className="flex items-start space-x-3 rounded-xl border border-slate-800/80 bg-slate-950/80 p-4 shadow-sm hover:border-slate-700 transition print-card">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-xs font-black text-indigo-400 border border-indigo-500/30 print-badge">
                {num}
              </span>
              <div className="text-xs text-slate-300 leading-relaxed pt-0.5 font-sans">
                {parts.map((part, pIdx) => {
                  if (part.startsWith("**") && part.endsWith("**")) {
                    const cleanText = part.slice(2, -2);
                    const isCurrency = cleanText.includes("₹") || cleanText.includes("RS") || cleanText.includes("INR");
                    const isMetric = cleanText.includes("%") || cleanText.includes("Months");

                    return (
                      <strong
                        key={pIdx}
                        className={`font-extrabold px-1 rounded ${
                          isCurrency
                            ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                            : isMetric
                            ? "text-indigo-300 bg-indigo-500/10 border border-indigo-500/20"
                            : "text-amber-300 bg-amber-500/10 border border-amber-500/20"
                        }`}
                      >
                        {cleanText}
                      </strong>
                    );
                  }
                  return <span key={pIdx}>{part}</span>;
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      {/* Hero Header */}
      <section className="relative border-b border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center space-x-2 rounded-full bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-400 border border-indigo-500/20 mb-4">
            <BrainCircuit className="h-3.5 w-3.5" />
            <span>AI Startup & Manufacturing Co-Founder (₹ INR Enabled)</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight font-display">
            AI Feasibility & <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Risk Evaluator</span>
          </h1>

          <p className="mt-4 text-base md:text-lg text-slate-300">
            Pitch your hardware concept. Receive an extensive AI Report in Indian Rupees (₹) with numbered point-by-point analysis, colored metrics, and PDF download options.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-10">
        {!report ? (
          <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 md:p-8 backdrop-blur-md space-y-6">
            {error && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-4 text-xs font-medium text-rose-300">
                {error}
              </div>
            )}

            {/* AI Model Provider Choice */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Select AI Model Engine *</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label
                  onClick={() => setFormData({ ...formData, aiModel: "groq" })}
                  className={`flex items-start space-x-3 rounded-xl border p-4 cursor-pointer transition ${
                    formData.aiModel === "groq"
                      ? "bg-indigo-950/40 border-indigo-500 text-white"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="aiModel"
                    value="groq"
                    checked={formData.aiModel === "groq"}
                    onChange={() => setFormData({ ...formData, aiModel: "groq" })}
                    className="mt-1 accent-indigo-500"
                  />
                  <div>
                    <div className="flex items-center space-x-1.5 text-sm font-bold text-white">
                      <Zap className="h-4 w-4 text-amber-400" />
                      <span>Groq Llama 3.3 (70B)</span>
                    </div>
                    <span className="inline-block mt-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      High Speed (~0.3s) Recommended
                    </span>
                  </div>
                </label>

                <label
                  onClick={() => setFormData({ ...formData, aiModel: "gemini" })}
                  className={`flex items-start space-x-3 rounded-xl border p-4 cursor-pointer transition ${
                    formData.aiModel === "gemini"
                      ? "bg-indigo-950/40 border-indigo-500 text-white"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="aiModel"
                    value="gemini"
                    checked={formData.aiModel === "gemini"}
                    onChange={() => setFormData({ ...formData, aiModel: "gemini" })}
                    className="mt-1 accent-indigo-500"
                  />
                  <div>
                    <div className="flex items-center space-x-1.5 text-sm font-bold text-white">
                      <Clock className="h-4 w-4 text-purple-400" />
                      <span>Google Gemini 2.5 Flash</span>
                    </div>
                    <span className="inline-block mt-1 text-[11px] font-semibold text-indigo-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                      Free Tier (~2s Slower)
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">Startup or Product Title *</label>
              <input
                type="text"
                placeholder="e.g. Solar-Powered Smart Compost Dehydrator for Apartments"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-white mb-2">Industry Sector</label>
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
                <label className="block text-sm font-semibold text-white mb-2">Estimated Capex Budget (₹ Rupees)</label>
                <select
                  value={formData.investmentTier}
                  onChange={(e) => setFormData({ ...formData, investmentTier: e.target.value })}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-sm text-white focus:border-indigo-500 focus:outline-none font-medium"
                >
                  <option value="< ₹5 Lakhs">&lt; ₹5 Lakhs (Micro Lab Prototype)</option>
                  <option value="₹5 Lakhs - ₹25 Lakhs">₹5 Lakhs - ₹25 Lakhs (Low Batch Production)</option>
                  <option value="₹25 Lakhs - ₹1 Crore">₹25 Lakhs - ₹1 Crore (Mid Industrial Plant)</option>
                  <option value="₹1 Crore+">₹1 Crore+ (Full Factory Plant)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">Detailed Product Concept & Materials *</label>
              <textarea
                rows={5}
                placeholder="Describe how the product works, key materials needed, target customer problem, and proposed manufacturing method..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">Target Audience / Customer Segment</label>
              <input
                type="text"
                placeholder="e.g. Urban Indian apartment dwellers, D2C Amazon/Shopify brands"
                value={formData.targetMarket}
                onChange={(e) => setFormData({ ...formData, targetMarket: e.target.value })}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 hover:opacity-95 transition-opacity disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Generating Detailed AI Report in ₹ INR...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Generate Detailed AI Report (₹ INR)</span>
                </>
              )}
            </button>
          </form>
        ) : (
          /* Report View - Printable Container */
          <div className="space-y-8 print-container">
            {/* Header Score Card & Download PDF Button */}
            <div className="rounded-2xl border border-indigo-500/40 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 md:p-8 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-6 print-card">
              <div>
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider block mb-1">
                  {report.aiProviderUsed || "AI Evaluator"}
                </span>
                <h2 className="text-3xl font-bold text-white">{report.title}</h2>
                <p className="text-xs text-slate-400 mt-1">Sector: {report.category}</p>
              </div>

              <div className="flex items-center space-x-3">
                <div className="text-center mr-2">
                  <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-indigo-600/20 text-3xl font-extrabold text-indigo-400 border border-indigo-500/40 shadow-inner">
                    {report.feasibilityScore}
                  </div>
                  <span className="block text-xs font-semibold text-emerald-400 mt-1">{report.ratingLabel}</span>
                </div>

                {/* PDF Download Button */}
                <button
                  onClick={() => window.print()}
                  className="no-print flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs shadow-lg hover:opacity-95 transition cursor-pointer"
                  title="Download Clean PDF Report"
                >
                  <Download className="h-4 w-4" />
                  <span>Download AI Report (PDF)</span>
                </button>

                <button
                  onClick={() => setReport(null)}
                  className="no-print rounded-xl bg-slate-800 p-2.5 text-slate-400 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                  title="Run Another Audit"
                >
                  <RotateCcw className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* AI REPORT SECTION */}
            <div className="rounded-2xl border border-indigo-500/30 bg-slate-900/60 p-6 md:p-8 backdrop-blur-md space-y-6 print-card">
              <div className="flex items-center space-x-2 text-indigo-400 border-b border-slate-800 pb-4">
                <FileText className="h-5 w-5" />
                <h3 className="text-xl font-bold text-white font-display">AI Report</h3>
                <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-semibold ml-auto no-print">
                  ₹ INR Formatted
                </span>
              </div>

              {/* Numbered Points & Colored Bold Formatting */}
              {report.detailedAnalysis && renderFormattedReport(report.detailedAnalysis)}
            </div>

            {/* Verdict Summary */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md print-card">
              <h3 className="text-base font-bold text-white mb-2">Executive Summary Verdict</h3>
              <p className="text-sm text-slate-300 leading-relaxed font-medium">{report.verdict}</p>
            </div>

            {/* Risk Matrix */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md print-card">
              <h3 className="text-base font-bold text-white mb-4 flex items-center space-x-2">
                <ShieldAlert className="h-4 w-4 text-amber-400" />
                <span>4-Vector Risk Assessment</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <span className="text-slate-400 block">Technical Difficulty</span>
                  <span className="font-bold text-white text-sm mt-0.5 block">{report.riskMatrix.technicalComplexity}</span>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <span className="text-slate-400 block">Supply Chain Risk</span>
                  <span className="font-bold text-amber-400 text-sm mt-0.5 block">{report.riskMatrix.supplyChainRisk}</span>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <span className="text-slate-400 block">Capital Intensity</span>
                  <span className="font-bold text-indigo-400 text-sm mt-0.5 block">{report.riskMatrix.capitalIntensity}</span>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <span className="text-slate-400 block">Regulatory Barrier</span>
                  <span className="font-bold text-purple-400 text-sm mt-0.5 block">{report.riskMatrix.regulatoryBarrier}</span>
                </div>
              </div>
            </div>

            {/* Financial Viability */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md print-card">
              <h3 className="text-base font-bold text-white mb-4 flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <span>Financial Viability & Projections (₹ INR)</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <span className="text-slate-400 block">Estimated COGS</span>
                  <span className="font-bold text-emerald-400 text-sm mt-0.5 block">{report.financialViability.estimatedCogs}</span>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <span className="text-slate-400 block">Projected Margin</span>
                  <span className="font-bold text-white text-sm mt-0.5 block">{report.financialViability.projectedMargin}</span>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <span className="text-slate-400 block">Break-Even Time</span>
                  <span className="font-bold text-indigo-400 text-sm mt-0.5 block">{report.financialViability.breakEvenMonths}</span>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <span className="text-slate-400 block">Suggested Retail MSRP</span>
                  <span className="font-bold text-purple-400 text-sm mt-0.5 block">{report.financialViability.recommendedRetailPrice}</span>
                </div>
              </div>
            </div>

            {/* Suggested BOM & Action Plan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md print-card">
                <h3 className="text-base font-bold text-white mb-3 flex items-center space-x-2">
                  <Boxes className="h-4 w-4 text-indigo-400" />
                  <span>Bill of Materials Outline (₹ INR)</span>
                </h3>
                <div className="space-y-2">
                  {report.billOfMaterials.map((bom, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/60">
                      <span className="text-slate-300">{bom.item}</span>
                      <span className="font-bold text-emerald-400">{bom.estimatedCost}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md print-card">
                <h3 className="text-base font-bold text-white mb-3 flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Recommended Action Plan</span>
                </h3>
                <div className="space-y-2.5">
                  {report.actionPlan.map((step, idx) => (
                    <div key={idx} className="flex items-start space-x-2.5 text-xs text-slate-300">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-[10px] font-bold text-indigo-400">
                        {idx + 1}
                      </span>
                      <span className="pt-0.5">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
