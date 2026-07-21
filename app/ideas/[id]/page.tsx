"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  ArrowLeft,
  ThumbsUp,
  DollarSign,
  TrendingUp,
  Layers,
  Wrench,
  CheckCircle2,
  AlertCircle,
  BrainCircuit,
  Boxes,
  Factory,
  ShieldCheck,
  Zap,
  Share2,
} from "lucide-react";

interface IdeaDetail {
  id: string;
  title: string;
  slug: string;
  tagline: string;
  category: string;
  investmentTier: string;
  profitMargin: string;
  difficulty: string;
  targetMarket: string;
  tam: string;
  sam: string;
  som: string;
  summary: string;
  problemStatement: string;
  proposedSolution: string;
  manufacturingProcess: string[];
  billOfMaterials: { item: string; costPerUnit: string; supplierType: string; essential: boolean }[];
  machineryNeeded: { name: string; estimatedCost: string; purpose: string }[];
  unitEconomics: {
    rawMaterialCost: number;
    laborCostPerUnit: number;
    packagingCost: number;
    wholesalePrice: number;
    retailPrice: number;
    grossMargin: number;
  };
  regulatoryRequirements: string[];
  competitorLandscape: { name: string; weakness: string; differentiation: string }[];
  growthPlaybook: string[];
  tags: string[];
  upvotes: number;
}

export default function IdeaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [idea, setIdea] = useState<IdeaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "bom" | "economics" | "workflow" | "compliance">("overview");
  const [upvotes, setUpvotes] = useState(0);
  const [upvoted, setUpvoted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadIdea() {
      try {
        const res = await fetch(`/api/ideas/${resolvedParams.id}`);
        if (res.ok) {
          const data = await res.json();
          setIdea(data.idea);
          setUpvotes(data.idea.upvotes);
        }
      } catch (err) {
        console.error("Failed to load idea detail:", err);
      } finally {
        setLoading(false);
      }
    }
    loadIdea();
  }, [resolvedParams.id]);

  const handleUpvote = async () => {
    if (upvoted || !idea) return;
    setUpvoted(true);
    setUpvotes((prev) => prev + 1);
    try {
      await fetch(`/api/ideas/${idea.id}/upvote`, { method: "POST" });
    } catch (err) {
      console.error("Upvote failed:", err);
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-16 text-center">
          <div className="h-10 w-48 bg-slate-900 rounded-xl animate-pulse mx-auto mb-6" />
          <div className="h-64 bg-slate-900 rounded-2xl animate-pulse" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-20 text-center">
          <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">Idea Blueprint Not Found</h1>
          <p className="mt-2 text-slate-400">The requested manufacturing concept does not exist or was removed.</p>
          <Link
            href="/ideas"
            className="mt-6 inline-flex items-center space-x-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Idea Explorer</span>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      {/* Header Banner */}
      <section className="relative overflow-hidden border-b border-slate-800 bg-slate-900/60 py-10 md:py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/ideas"
            className="inline-flex items-center space-x-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors mb-6"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Idea Explorer</span>
          </Link>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="rounded-lg bg-indigo-950 px-3 py-1 text-xs font-medium text-indigo-300 border border-indigo-800/40">
              {idea.category}
            </span>
            <span className="rounded-lg bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300 border border-slate-700">
              Capex: {idea.investmentTier}
            </span>
            <span className="rounded-lg bg-purple-950 px-3 py-1 text-xs font-medium text-purple-300 border border-purple-800/40">
              Margin: {idea.profitMargin}
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white font-display">
            {idea.title}
          </h1>

          <p className="mt-3 text-base md:text-lg text-slate-300 max-w-3xl leading-relaxed">
            {idea.tagline}
          </p>

          {/* Quick Metrics Bar */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-800 pt-6">
            <div>
              <span className="block text-xs text-slate-400">Total Addressable Market</span>
              <span className="text-sm font-bold text-white mt-0.5 block">{idea.tam}</span>
            </div>
            <div>
              <span className="block text-xs text-slate-400">Serviceable Market</span>
              <span className="text-sm font-bold text-white mt-0.5 block">{idea.sam}</span>
            </div>
            <div>
              <span className="block text-xs text-slate-400">Target Audience</span>
              <span className="text-sm font-bold text-white mt-0.5 block truncate">{idea.targetMarket}</span>
            </div>
            <div>
              <span className="block text-xs text-slate-400">Difficulty Rating</span>
              <span className="text-sm font-bold text-emerald-400 mt-0.5 block">{idea.difficulty}</span>
            </div>
          </div>

          {/* Action Header Buttons */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              onClick={handleUpvote}
              disabled={upvoted}
              className={`inline-flex items-center space-x-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                upvoted
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-800 text-slate-200 hover:bg-indigo-600/20 hover:text-indigo-300 border border-slate-700"
              }`}
            >
              <ThumbsUp className={`h-4 w-4 ${upvoted ? "fill-current" : ""}`} />
              <span>Upvote Idea ({upvotes})</span>
            </button>

            <Link
              href={`/feasibility?title=${encodeURIComponent(idea.title)}&category=${encodeURIComponent(idea.category)}&tier=${encodeURIComponent(idea.investmentTier)}&targetMarket=${encodeURIComponent(idea.targetMarket)}&description=${encodeURIComponent(idea.proposedSolution || idea.summary || idea.tagline)}`}
              className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-xs font-semibold text-white hover:from-indigo-500 hover:to-purple-500 shadow-md shadow-indigo-600/20 transition-all"
            >
              <BrainCircuit className="h-4 w-4" />
              <span>Run AI Feasibility Audit</span>
            </Link>

            <button
              onClick={handleShare}
              className="inline-flex items-center space-x-2 rounded-xl bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 border border-slate-700 transition-colors"
            >
              <Share2 className="h-4 w-4" />
              <span>{copied ? "Copied Link!" : "Share Blueprint"}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Tabs Navigation */}
      <div className="sticky top-16 z-40 bg-slate-950/90 border-b border-slate-800 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-6 overflow-x-auto py-3 text-xs md:text-sm font-semibold no-scrollbar">
            {[
              { id: "overview", label: "Executive Overview", icon: Layers },
              { id: "bom", label: "Bill of Materials & Machinery", icon: Boxes },
              { id: "economics", label: "Unit Economics", icon: DollarSign },
              { id: "workflow", label: "Manufacturing Workflow", icon: Factory },
              { id: "compliance", label: "Competitors & Compliance", icon: ShieldCheck },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`inline-flex items-center space-x-2 border-b-2 pb-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? "border-indigo-500 text-indigo-400 font-bold"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content Details */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md">
              <h2 className="text-xl font-bold text-white mb-3 font-display">Problem Statement</h2>
              <p className="text-slate-300 leading-relaxed">{idea.problemStatement}</p>
            </div>

            <div className="rounded-2xl border border-indigo-900/50 bg-indigo-950/20 p-6 backdrop-blur-md">
              <h2 className="text-xl font-bold text-indigo-300 mb-3 font-display">Proposed Solution & Concept</h2>
              <p className="text-slate-200 leading-relaxed">{idea.proposedSolution}</p>
              <div className="mt-4 pt-4 border-t border-indigo-900/40 text-sm text-slate-300">
                <strong>Executive Summary:</strong> {idea.summary}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md">
              <h2 className="text-xl font-bold text-white mb-4 font-display">Go-To-Market & Growth Playbook</h2>
              <div className="space-y-3">
                {idea.growthPlaybook.map((step, idx) => (
                  <div key={idx} className="flex items-start space-x-3 text-sm text-slate-300">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-400 border border-indigo-500/30">
                      {idx + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BILL OF MATERIALS & MACHINERY */}
        {activeTab === "bom" && (
          <div className="space-y-8">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md">
              <h2 className="text-xl font-bold text-white mb-4 font-display flex items-center space-x-2">
                <Boxes className="h-5 w-5 text-indigo-400" />
                <span>Bill of Materials (BOM) Breakdown</span>
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950 text-xs uppercase text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Component / Material</th>
                      <th className="px-4 py-3">Estimated Cost</th>
                      <th className="px-4 py-3">Supplier Category</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {idea.billOfMaterials.map((bom, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/60">
                        <td className="px-4 py-3 font-semibold text-white">{bom.item}</td>
                        <td className="px-4 py-3 text-emerald-400 font-medium">{bom.costPerUnit}</td>
                        <td className="px-4 py-3 text-slate-400">{bom.supplierType}</td>
                        <td className="px-4 py-3">
                          {bom.essential ? (
                            <span className="inline-flex items-center text-xs font-semibold text-rose-400">Essential</span>
                          ) : (
                            <span className="inline-flex items-center text-xs text-slate-400">Optional</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md">
              <h2 className="text-xl font-bold text-white mb-4 font-display flex items-center space-x-2">
                <Wrench className="h-5 w-5 text-purple-400" />
                <span>Required Capital Equipment & Machinery</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {idea.machineryNeeded.map((machine, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-white text-base">{machine.name}</h3>
                      <span className="text-xs font-semibold text-purple-400 bg-purple-950/60 px-2.5 py-1 rounded-md border border-purple-800/40">
                        {machine.estimatedCost}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-300 leading-relaxed">{machine.purpose}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: UNIT ECONOMICS */}
        {activeTab === "economics" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md text-center">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Raw Material Cost</span>
                <p className="text-3xl font-extrabold text-white mt-2">₹{idea.unitEconomics.rawMaterialCost}</p>
                <span className="text-xs text-slate-400 mt-1 block">per unit finished good</span>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md text-center">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Wholesale Selling Price</span>
                <p className="text-3xl font-extrabold text-indigo-400 mt-2">₹{idea.unitEconomics.wholesalePrice}</p>
                <span className="text-xs text-slate-400 mt-1 block">B2B distributor pricing</span>
              </div>

              <div className="rounded-2xl border border-emerald-900/50 bg-emerald-950/20 p-6 backdrop-blur-md text-center">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Gross Profit Margin</span>
                <p className="text-3xl font-extrabold text-emerald-400 mt-2">{idea.unitEconomics.grossMargin}%</p>
                <span className="text-xs text-emerald-300 mt-1 block">retail MSRP: ₹{idea.unitEconomics.retailPrice}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md">
              <h2 className="text-xl font-bold text-white mb-4 font-display">Unit Cost Breakdown (₹ INR)</h2>
              <div className="space-y-4">
                <div className="flex justify-between text-sm py-2 border-b border-slate-800">
                  <span className="text-slate-300">Raw Component Materials</span>
                  <span className="font-semibold text-white">₹{idea.unitEconomics.rawMaterialCost}</span>
                </div>
                <div className="flex justify-between text-sm py-2 border-b border-slate-800">
                  <span className="text-slate-300">Direct Labor & Assembly per Unit</span>
                  <span className="font-semibold text-white">₹{idea.unitEconomics.laborCostPerUnit}</span>
                </div>
                <div className="flex justify-between text-sm py-2 border-b border-slate-800">
                  <span className="text-slate-300">Packaging & Shipping Buffer</span>
                  <span className="font-semibold text-white">₹{idea.unitEconomics.packagingCost}</span>
                </div>
                <div className="flex justify-between text-base font-bold py-3 text-emerald-400 bg-slate-950/80 px-4 rounded-xl">
                  <span>Total Cost of Goods Sold (COGS)</span>
                  <span>
                    ₹{(
                      idea.unitEconomics.rawMaterialCost +
                      idea.unitEconomics.laborCostPerUnit +
                      idea.unitEconomics.packagingCost
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: WORKFLOW */}
        {activeTab === "workflow" && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md">
            <h2 className="text-xl font-bold text-white mb-6 font-display flex items-center space-x-2">
              <Factory className="h-5 w-5 text-indigo-400" />
              <span>Step-by-Step Manufacturing Assembly Workflow</span>
            </h2>

            <div className="relative border-l-2 border-indigo-500/30 ml-4 space-y-8">
              {idea.manufacturingProcess.map((step, idx) => (
                <div key={idx} className="relative pl-6">
                  <div className="absolute -left-[9px] top-1.5 h-4 w-4 rounded-full bg-indigo-500 ring-4 ring-slate-950" />
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Step {idx + 1}</span>
                  <h3 className="text-base font-semibold text-white mt-1">{step}</h3>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: COMPLIANCE & COMPETITORS */}
        {activeTab === "compliance" && (
          <div className="space-y-8">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md">
              <h2 className="text-xl font-bold text-white mb-4 font-display">Competitor Differentiation Matrix</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {idea.competitorLandscape.map((comp, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
                    <h3 className="font-bold text-white text-base">{comp.name}</h3>
                    <p className="text-xs text-rose-400 mt-1"><strong>Weakness:</strong> {comp.weakness}</p>
                    <p className="text-xs text-emerald-400 mt-1"><strong>Our Advantage:</strong> {comp.differentiation}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md">
              <h2 className="text-xl font-bold text-white mb-4 font-display">Regulatory & Safety Requirements</h2>
              <div className="space-y-2.5">
                {idea.regulatoryRequirements.map((req, idx) => (
                  <div key={idx} className="flex items-center space-x-3 text-sm text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>{req}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
