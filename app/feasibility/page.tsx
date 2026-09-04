"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  FileText,
  Download,
  Globe,
  Gauge,
  Link2,
  AlertTriangle,
  Scale,
  History,
  Loader2,
  ChevronDown,
  Activity,
} from "lucide-react";

/* ------------------------------------------------------------------ *
 * Types                                                               *
 * ------------------------------------------------------------------ */

interface CitedSource {
  title: string;
  url: string;
  source: string;
  sourceType: string;
  snippet: string;
  retrievedAt: string;
}

interface ConfidenceFactor {
  key: string;
  label: string;
  score: number;
  max: number;
  detail: string;
}

interface Confidence {
  score: number;
  band: string;
  summary: string;
  factors: ConfidenceFactor[];
  caveats: string[];
}

interface ModelRun {
  provider: string;
  model: string;
  label: string;
  score: number;
  latencyMs: number;
}

interface ValidationVerdict {
  valid: boolean;
  stage: "deterministic" | "ai-gate" | "passed";
  code: string | null;
  reason: string;
  guidance: string;
  gate?: {
    model: string;
    label: string;
    latencyMs: number;
    clarityScore: number;
    failedOpen?: boolean;
    realisticCapitalInr?: string;
  };
}

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
  confidence?: Confidence;
  citedSources?: CitedSource[];
  modelRuns?: ModelRun[];
  modelErrors?: string[];
  keyUncertainties?: string[];
  secondOpinions?: { label: string; score: number; verdict: string }[];
  comparablePitches?: { title: string; score: number; similarity: number }[];
  evidenceMeta?: {
    sourcesUsed: string[];
    failures: { source: string; reason: string }[];
    queryTerms: string[];
    durationMs: number;
    cached: boolean;
  };
  totalDurationMs?: number;
  validation?: ValidationVerdict;
}

interface ProviderStatus {
  provider: string;
  configured: boolean;
  reachable: boolean;
  workingModel: string | null;
  latencyMs: number | null;
  error: string | null;
}

/* ------------------------------------------------------------------ *
 * Small presentational helpers                                        *
 * ------------------------------------------------------------------ */

function scoreTone(score: number) {
  if (score >= 75) return { text: "text-emerald-400", bg: "bg-emerald-500/10", ring: "border-emerald-500/40", bar: "bg-emerald-500" };
  if (score >= 41) return { text: "text-amber-400", bg: "bg-amber-500/10", ring: "border-amber-500/40", bar: "bg-amber-500" };
  return { text: "text-rose-400", bg: "bg-rose-500/10", ring: "border-rose-500/40", bar: "bg-rose-500" };
}

/** Radial gauge for the two headline numbers. Pure SVG, no chart library. */
function RadialGauge({
  value,
  label,
  sublabel,
  size = 128,
}: {
  value: number;
  label: string;
  sublabel?: string;
  size?: number;
}) {
  const tone = scoreTone(value);
  const stroke = 9;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(100, value)) / 100) * circumference;

  return (
    <div className="flex flex-col items-center shrink-0">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(148,163,184,0.16)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            className={tone.text}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-extrabold leading-none ${tone.text}`}>{value}</span>
          <span className="text-[10px] font-bold text-slate-500 mt-0.5">/ 100</span>
        </div>
      </div>
      <span className="mt-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
      {sublabel && <span className={`text-xs font-semibold ${tone.text}`}>{sublabel}</span>}
    </div>
  );
}

const ASSESSMENT_STEPS = [
  { key: "screen", label: "Screening the pitch", hint: "Checking the input is language, not a keyboard mash" },
  { key: "gate", label: "Validating the concept", hint: "Two independent checks that the idea is real, buildable and sanely capitalised" },
  { key: "research", label: "Searching live sources", hint: "Wikipedia, World Bank, Crossref, arXiv, Hacker News" },
  { key: "models", label: "Running independent AI models", hint: "Two models assess the same evidence separately" },
  { key: "reconcile", label: "Reconciling verdicts", hint: "Averaging scores and measuring disagreement" },
  { key: "confidence", label: "Scoring confidence", hint: "Weighing evidence quality and model agreement" },
];

/** Time-based progress indicator. Honest about being an estimate. */
function AssessmentProgress({ elapsedMs }: { elapsedMs: number }) {
  // Tuned against measured runs: the gate resolves by ~5s, a full assessment
  // lands between 9s and 25s depending on provider latency.
  const stepIndex =
    elapsedMs < 1200 ? 0
    : elapsedMs < 6000 ? 1
    : elapsedMs < 12000 ? 2
    : elapsedMs < 20000 ? 3
    : elapsedMs < 25000 ? 4
    : 5;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 md:p-8 animate-rise">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-5">
        <Loader2 className="h-5 w-5 text-indigo-400 animate-spin" />
        <div className="min-w-0">
          <h3 className="text-base font-bold text-white">Running evidence-grounded assessment</h3>
          <p className="text-xs text-slate-400">
            {(elapsedMs / 1000).toFixed(1)}s elapsed — live research plus two AI models usually takes 15-30s.
          </p>
        </div>
      </div>

      <ol className="space-y-3">
        {ASSESSMENT_STEPS.map((step, idx) => {
          const done = idx < stepIndex;
          const active = idx === stepIndex;
          return (
            <li key={step.key} className="flex items-start gap-3">
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold transition-colors duration-500 ${
                  done
                    ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
                    : active
                      ? "border-indigo-500/50 bg-indigo-500/15 text-indigo-300"
                      : "border-slate-700 bg-slate-900 text-slate-600"
                }`}
              >
                {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : idx + 1}
              </span>
              <div className="min-w-0">
                <p className={`text-sm font-semibold transition-colors ${done || active ? "text-white" : "text-slate-500"}`}>
                  {step.label}
                </p>
                <p className="text-[11px] text-slate-500">{step.hint}</p>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-6 space-y-2.5" aria-hidden="true">
        <div className="skeleton h-3 w-3/4" />
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-3 w-5/6" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Page                                                                *
 * ------------------------------------------------------------------ */

export default function FeasibilityPage() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Manufacturing",
    investmentTier: "₹5 Lakhs - ₹25 Lakhs",
    targetMarket: "",
    aiModel: "groq",
    consensus: true,
  });

  const [loading, setLoading] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [report, setReport] = useState<AssessmentReport | null>(null);
  const [error, setError] = useState("");
  const [providers, setProviders] = useState<ProviderStatus[] | null>(null);

  const autoRunRef = useRef(false);

  /* Live provider status, so the engine picker reflects what actually works. */
  useEffect(() => {
    let cancelled = false;
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setProviders(d.providers || []);
      })
      .catch(() => {
        if (!cancelled) setProviders([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /* Elapsed-time ticker drives the progress stepper. The counter is reset by
     whoever starts the run, so this effect only ever subscribes to the clock. */
  useEffect(() => {
    if (!loading) return;
    const startedAt = Date.now();
    const id = setInterval(() => setElapsedMs(Date.now() - startedAt), 100);
    return () => clearInterval(id);
  }, [loading]);

  const runAssessment = useCallback(async (dataToSubmit: typeof formData) => {
    if (!dataToSubmit.title || !dataToSubmit.description) {
      setError("Please fill out the concept title and detailed description.");
      return;
    }

    setError("");
    setElapsedMs(0);
    setLoading(true);
    // Jump up as the tall form is swapped for the short progress card. Doing
    // this on arrival instead left a long smooth-scroll running over the report
    // and a gap of empty page while it caught up.
    window.scrollTo({ top: 0, behavior: "auto" });

    try {
      const res = await fetch("/api/feasibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...dataToSubmit,
          targetMarket: dataToSubmit.targetMarket || "Indian D2C and B2B buyers",
        }),
      });

      if (!res.ok) throw new Error("Assessment failed");
      const data = await res.json();
      setReport(data.report);
    } catch {
      setError("Failed to run the feasibility audit. Check the engine status above and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  /* Accept a pitch handed over from an idea detail page and run it once.
     The state update is deferred to a task rather than run in the effect body:
     seeding it from the URL during render would diverge from the server-rendered
     markup, and setting it synchronously here would cascade an extra render. */
  useEffect(() => {
    if (typeof window === "undefined" || autoRunRef.current) return;

    const params = new URLSearchParams(window.location.search);
    const title = params.get("title");
    const description = params.get("description");
    if (!title || !description) return;

    autoRunRef.current = true;
    const transferred = {
      title,
      category: params.get("category") || "Manufacturing",
      investmentTier: params.get("tier") || "₹5 Lakhs - ₹25 Lakhs",
      targetMarket: params.get("targetMarket") || "",
      description,
      aiModel: "groq",
      consensus: true,
    };
    window.history.replaceState({}, document.title, window.location.pathname);

    const id = setTimeout(() => {
      setFormData(transferred);
      runAssessment(transferred);
    }, 0);
    return () => clearTimeout(id);
  }, [runAssessment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await runAssessment(formData);
  };

  const sources = useMemo(() => report?.citedSources ?? [], [report]);

  /**
   * Renders the model's numbered analysis. Handles the two shapes models
   * actually emit — `**1. Header:** body` and `1. **Header**: body` — plus
   * plain unnumbered paragraphs, and turns [n] markers into links that jump to
   * the matching source.
   */
  const renderFormattedReport = (rawText: string) => {
    const normalized = rawText
      .replace(/\r\n/g, "\n")
      // Split runs of numbered points that arrived on a single line. The marker
      // must be followed by whitespace and a capitalised word, otherwise a
      // decimal inside the prose ("1.46 billion", "₹2.5 Lakhs") gets torn in
      // half and rendered as a spurious list item.
      .replace(/\s+(?=\*{0,2}\d{1,2}[.)]\s+\*{0,2}[A-Z])/g, "\n");

    const lines = normalized.split(/\n{1,}/).map((l) => l.trim()).filter(Boolean);

    return (
      <div className="space-y-3 stagger">
        {lines.map((line, idx) => {
          let num = "";
          let heading = "";
          let body = line;

          // Each pattern requires whitespace after the "n." marker so a line
          // that merely opens with a decimal is left as plain prose.
          const boldNumbered = line.match(/^\*\*\s*(\d{1,2})[.)]\s*([^*]*?)\s*:?\s*\*\*\s*:?\s*([\s\S]*)$/);
          const plainNumbered = line.match(/^(\d{1,2})[.)]\s+\*\*([^*]+?)\*\*\s*:?\s*([\s\S]*)$/);
          const bareNumbered = line.match(/^(\d{1,2})[.)]\s+([\s\S]*)$/);

          if (boldNumbered) {
            [, num, heading, body] = boldNumbered;
          } else if (plainNumbered) {
            [, num, heading, body] = plainNumbered;
          } else if (bareNumbered) {
            [, num, body] = bareNumbered;
          }

          return (
            <div
              key={idx}
              className="flex items-start gap-3 rounded-xl border border-slate-800/80 bg-slate-950/70 p-4 transition-colors hover:border-slate-700 print-card"
            >
              {num && (
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-indigo-500/30 bg-indigo-500/15 text-xs font-black text-indigo-300 print-badge">
                  {num}
                </span>
              )}
              <div className="min-w-0 flex-1 pt-0.5">
                {heading && (
                  <h4 className="mb-1 text-sm font-bold text-purple-300">{heading}</h4>
                )}
                <p className="text-[13px] leading-relaxed text-slate-300">
                  {renderInline(body)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  /** Bold spans and [n] citation chips inside a paragraph of model output. */
  const renderInline = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*|\[\d+\])/g).filter(Boolean);

    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong
            key={i}
            className="mx-0.5 rounded border border-emerald-700/40 bg-emerald-950/60 px-1.5 py-0.5 font-bold text-emerald-300"
          >
            {part.slice(2, -2)}
          </strong>
        );
      }

      const citation = part.match(/^\[(\d+)\]$/);
      if (citation) {
        const n = Number(citation[1]);
        const source = sources[n - 1];
        if (!source) return <span key={i}>{part}</span>;
        return (
          <a
            key={i}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            title={`${source.source}: ${source.title}`}
            className="mx-0.5 inline-flex items-center rounded border border-indigo-600/40 bg-indigo-500/15 px-1.5 text-[10px] font-bold align-super text-indigo-300 transition-colors hover:bg-indigo-500/30 hover:text-indigo-200"
          >
            {n}
          </a>
        );
      }

      return <span key={i}>{part}</span>;
    });
  };

  const engineOptions = [
    {
      id: "groq",
      name: "Groq",
      icon: Zap,
      iconClass: "text-amber-400",
      blurb: "Fastest — sub-second first token",
    },
    {
      id: "gemini",
      name: "Google Gemini",
      icon: Sparkles,
      iconClass: "text-purple-400",
      blurb: "Strong long-form reasoning",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 font-sans text-slate-100">
      <Navbar />

      <section className="relative border-b border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 py-10 md:py-14">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-300">
            <BrainCircuit className="h-3.5 w-3.5" />
            <span>Evidence-grounded, multi-model, confidence-scored</span>
          </div>

          <h1 className="font-display text-3xl font-extrabold tracking-tight text-white md:text-5xl">
            AI Feasibility &{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Risk Evaluator
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-300 md:text-base">
            Pitch your concept. It is researched against live public data, assessed independently
            by two AI models, and returned with every source cited and a confidence score telling
            you how much to trust the verdict.
          </p>
        </div>
      </section>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 md:py-10">
        {loading ? (
          <AssessmentProgress elapsedMs={elapsedMs} />
        ) : !report ? (
          <form
            onSubmit={handleSubmit}
            className="animate-rise space-y-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 md:p-8"
          >
            {error && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-medium text-rose-300">
                {error}
              </div>
            )}

            {/* Live engine status */}
            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <label className="text-sm font-semibold text-white">Primary AI engine</label>
                <ProviderPills providers={providers} />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {engineOptions.map((opt) => {
                  const status = providers?.find((p) => p.provider === opt.id);
                  const selected = formData.aiModel === opt.id;
                  const Icon = opt.icon;
                  return (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => setFormData({ ...formData, aiModel: opt.id })}
                      aria-pressed={selected}
                      className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all duration-200 ${
                        selected
                          ? "border-indigo-500 bg-indigo-950/40 text-white shadow-lg shadow-indigo-950/40"
                          : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:bg-slate-900"
                      }`}
                    >
                      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${opt.iconClass}`} />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-white">
                          {opt.name}
                          {status && (
                            <span
                              className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-bold ${
                                status.reachable
                                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                                  : "border-rose-500/30 bg-rose-500/10 text-rose-400"
                              }`}
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-current" />
                              {status.reachable ? "Live" : "Down"}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-400">{opt.blurb}</p>
                        {status?.workingModel && (
                          <p className="mt-1 truncate font-mono text-[10px] text-slate-500">
                            {status.workingModel}
                            {status.latencyMs != null && ` · ${status.latencyMs}ms`}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 transition-colors hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={formData.consensus}
                  onChange={(e) => setFormData({ ...formData, consensus: e.target.checked })}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-indigo-500"
                />
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-white">
                    <Scale className="h-3.5 w-3.5 text-indigo-400" />
                    Cross-check with a second model
                  </span>
                  <span className="mt-0.5 block text-[11px] text-slate-400">
                    Runs both engines on identical evidence and averages their scores. Slower, but
                    disagreement between them is what makes the confidence score meaningful.
                  </span>
                </span>
              </label>
            </div>

            <div>
              <label htmlFor="title" className="mb-2 block text-sm font-semibold text-white">
                Startup or product title <span className="text-rose-400">*</span>
              </label>
              <input
                id="title"
                type="text"
                placeholder="e.g. Solar-powered smart compost dehydrator for apartments"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 transition-colors focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="category" className="mb-2 block text-sm font-semibold text-white">
                  Industry sector
                </label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white transition-colors focus:border-indigo-500 focus:outline-none"
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
                <label htmlFor="tier" className="mb-2 block text-sm font-semibold text-white">
                  Estimated capex budget (₹)
                </label>
                <select
                  id="tier"
                  value={formData.investmentTier}
                  onChange={(e) => setFormData({ ...formData, investmentTier: e.target.value })}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-medium text-white transition-colors focus:border-indigo-500 focus:outline-none"
                >
                  <option value="< ₹5 Lakhs">&lt; ₹5 Lakhs (micro lab prototype)</option>
                  <option value="₹5 Lakhs - ₹25 Lakhs">₹5 Lakhs - ₹25 Lakhs (low batch production)</option>
                  <option value="₹25 Lakhs - ₹1 Crore">₹25 Lakhs - ₹1 Crore (mid industrial plant)</option>
                  <option value="₹1 Crore+">₹1 Crore+ (full factory plant)</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="description" className="mb-2 block text-sm font-semibold text-white">
                Detailed product concept &amp; materials <span className="text-rose-400">*</span>
              </label>
              <textarea
                id="description"
                rows={6}
                placeholder="Describe how the product works, the key materials or components, the customer problem, and how it would be manufactured. The more specific you are, the higher the confidence score can go."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full resize-y rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm leading-relaxed text-white placeholder-slate-500 transition-colors focus:border-indigo-500 focus:outline-none"
                required
              />
              <p className="mt-1.5 text-[11px] text-slate-500">
                {formData.description.trim().split(/\s+/).filter(Boolean).length} words — aim for 60+
                with materials, volumes and a named buyer.
              </p>
            </div>

            <div>
              <label htmlFor="market" className="mb-2 block text-sm font-semibold text-white">
                Target audience / customer segment
              </label>
              <input
                id="market"
                type="text"
                placeholder="e.g. Urban Indian apartment dwellers, D2C Amazon/Shopify brands"
                value={formData.targetMarket}
                onChange={(e) => setFormData({ ...formData, targetMarket: e.target.value })}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 transition-colors focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-gradient flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              <span>Research &amp; assess this concept</span>
            </button>
          </form>
        ) : report.validation && !report.validation.valid ? (
          <RejectedView report={report} onReset={() => setReport(null)} />
        ) : (
          <ReportView
            report={report}
            sources={sources}
            onReset={() => setReport(null)}
            renderFormattedReport={renderFormattedReport}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Provider status pills                                               *
 * ------------------------------------------------------------------ */

function ProviderPills({ providers }: { providers: ProviderStatus[] | null }) {
  if (providers === null) {
    return (
      <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
        <Loader2 className="h-3 w-3 animate-spin" /> Checking engines…
      </span>
    );
  }

  const live = providers.filter((p) => p.reachable);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
        live.length >= 2
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
          : live.length === 1
            ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
            : "border-rose-500/30 bg-rose-500/10 text-rose-400"
      }`}
    >
      <Activity className="h-3 w-3" />
      {live.length >= 2
        ? `${live.length} engines live — cross-checking on`
        : live.length === 1
          ? "1 engine live — no cross-check"
          : "No engine reachable"}
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * Rejection view                                                      *
 * ------------------------------------------------------------------ */

const REJECTION_TITLE: Record<string, string> = {
  empty: "Nothing to assess",
  "too-short": "Not enough to go on",
  gibberish: "That is not a readable pitch",
  "not-a-product": "That is a goal, not a product",
  implausible: "This cannot work as described",
  "self-contradictory": "The pitch contradicts itself",
  "no-differentiation": "No edge over the incumbents",
  "capital-mismatch": "The capital does not match the concept",
};

/**
 * Shown when a pitch never reached assessment. Deliberately shows no gauges,
 * no bill of materials and no financial fields — there is nothing to report,
 * and rendering empty scaffolding would imply an assessment happened.
 */
function RejectedView({ report, onReset }: { report: AssessmentReport; onReset: () => void }) {
  const v = report.validation!;
  const heading = REJECTION_TITLE[v.code ?? ""] ?? "Not assessable";

  const stages = [
    {
      label: "Stage 1 — input screening",
      hint: "Is this readable language?",
      state: v.stage === "deterministic" ? "failed" : "passed",
    },
    {
      label: "Stage 2 — concept validity",
      hint: "Is this a real, buildable, sanely-capitalised idea?",
      state: v.stage === "deterministic" ? "skipped" : "failed",
    },
    { label: "Stage 3 — full assessment", hint: "Live research and two AI models", state: "skipped" },
  ] as const;

  return (
    <div className="space-y-5">
      <div className="animate-rise rounded-2xl border border-rose-500/40 bg-gradient-to-r from-slate-900 via-rose-950/25 to-slate-900 p-5 md:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-rose-300">
              <AlertTriangle className="h-3 w-3" />
              Rejected before assessment
            </span>
            <h2 className="text-2xl font-bold leading-tight text-white md:text-3xl">{heading}</h2>
            <p className="mt-1 truncate text-xs text-slate-400">
              Pitch: “{report.title}” · {report.category}
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-center">
            <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full border-2 border-rose-500/40 bg-rose-500/10">
              <span className="text-3xl font-extrabold leading-none text-rose-400">0</span>
              <span className="mt-0.5 text-[10px] font-bold text-slate-500">/ 100</span>
            </div>
            <span className="mt-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Feasibility
            </span>
          </div>
        </div>
      </div>

      <section className="animate-rise rounded-2xl border border-slate-800 bg-slate-900/50 p-5 md:p-6">
        <h3 className="mb-2 text-base font-bold text-white">Why</h3>
        <p className="text-sm leading-relaxed text-slate-300">{v.reason}</p>

        {v.gate?.realisticCapitalInr && (
          <p className="mt-3 rounded-xl border border-amber-600/30 bg-amber-950/25 p-3 text-xs text-amber-200">
            Realistic starting capital for this concept:{" "}
            <strong className="font-bold text-amber-100">{v.gate.realisticCapitalInr}</strong>
          </p>
        )}

        <h3 className="mb-2 mt-5 text-base font-bold text-white">How to fix it</h3>
        <p className="text-sm leading-relaxed text-slate-300">{v.guidance}</p>

        <button
          onClick={onReset}
          className="btn-gradient mt-5 flex cursor-pointer items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-lg"
        >
          <RotateCcw className="h-4 w-4" />
          Rewrite the pitch
        </button>
      </section>

      <section className="animate-rise rounded-2xl border border-slate-800 bg-slate-900/40 p-5 md:p-6">
        <header className="mb-4 flex items-center gap-2">
          <Scale className="h-4 w-4 text-indigo-400" />
          <h3 className="text-base font-bold text-white">Where it stopped</h3>
          {report.totalDurationMs != null && (
            <span className="ml-auto text-[11px] text-slate-500">
              stopped after {(report.totalDurationMs / 1000).toFixed(1)}s
            </span>
          )}
        </header>

        <ol className="space-y-2.5">
          {stages.map((s) => (
            <li key={s.label} className="flex items-start gap-3">
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold ${
                  s.state === "passed"
                    ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
                    : s.state === "failed"
                      ? "border-rose-500/40 bg-rose-500/15 text-rose-400"
                      : "border-slate-700 bg-slate-900 text-slate-600"
                }`}
              >
                {s.state === "passed" ? <CheckCircle2 className="h-3.5 w-3.5" /> : s.state === "failed" ? "✕" : "–"}
              </span>
              <div className="min-w-0">
                <p
                  className={`text-sm font-semibold ${
                    s.state === "skipped" ? "text-slate-500" : "text-white"
                  }`}
                >
                  {s.label}
                  <span className="ml-2 text-[11px] font-normal text-slate-500">
                    {s.state === "passed" ? "passed" : s.state === "failed" ? "rejected here" : "not run"}
                  </span>
                </p>
                <p className="text-[11px] text-slate-500">{s.hint}</p>
              </div>
            </li>
          ))}
        </ol>

        <p className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-[11px] leading-relaxed text-slate-400">
          The pipeline stops at the first failed check, so no sources were fetched and no analysis
          was run. No financial figures are shown, because estimating a bill of materials for a
          concept that was rejected would be inventing them.
          {v.gate && !v.gate.failedOpen && (
            <>
              {" "}
              Validity check by <span className="font-mono text-slate-400">{v.gate.label}</span> in{" "}
              {(v.gate.latencyMs / 1000).toFixed(1)}s.
            </>
          )}
        </p>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Report view                                                         *
 * ------------------------------------------------------------------ */

function ReportView({
  report,
  sources,
  onReset,
  renderFormattedReport,
}: {
  report: AssessmentReport;
  sources: CitedSource[];
  onReset: () => void;
  renderFormattedReport: (raw: string) => React.ReactNode;
}) {
  const confidence = report.confidence;

  return (
    <div className="print-container space-y-6">
      {/* Headline */}
      <div className="animate-rise rounded-2xl border border-indigo-500/40 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-5 md:p-7 print-card">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-indigo-400">
              {report.aiProviderUsed || "AI Evaluator"}
            </span>
            <h2 className="text-2xl font-bold leading-tight text-white md:text-3xl">{report.title}</h2>
            <p className="mt-1 text-xs text-slate-400">
              Sector: {report.category}
              {report.totalDurationMs != null &&
                ` · assessed in ${(report.totalDurationMs / 1000).toFixed(1)}s`}
            </p>

            <div className="no-print mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => window.print()}
                className="btn-gradient flex cursor-pointer items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-lg"
              >
                <Download className="h-4 w-4" />
                Download report (PDF)
              </button>
              <button
                onClick={onReset}
                className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
              >
                <RotateCcw className="h-4 w-4" />
                Assess another
              </button>
            </div>
          </div>

          <div className="flex shrink-0 items-start justify-center gap-6 sm:gap-8">
            <RadialGauge value={report.feasibilityScore} label="Feasibility" sublabel={report.ratingLabel} />
            {confidence && (
              <RadialGauge value={confidence.score} label="Confidence" sublabel={confidence.band} />
            )}
          </div>
        </div>
      </div>

      {/* Confidence breakdown */}
      {confidence && (
        <section className="animate-rise rounded-2xl border border-slate-800 bg-slate-900/50 p-5 md:p-6 print-card">
          <header className="mb-4 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Gauge className="h-4 w-4 text-indigo-400" />
            <h3 className="text-base font-bold text-white">How much to trust this verdict</h3>
          </header>

          <p className="mb-4 text-sm leading-relaxed text-slate-300">{confidence.summary}</p>

          {confidence.caveats.length > 0 && (
            <div className="mb-5 space-y-2">
              {confidence.caveats.map((caveat, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 rounded-xl border border-amber-600/30 bg-amber-950/30 p-3 text-xs text-amber-200"
                >
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                  <span>{caveat}</span>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {confidence.factors.map((factor) => {
              const pct = factor.max > 0 ? (factor.score / factor.max) * 100 : 0;
              return (
                <div key={factor.key} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5">
                  <div className="mb-1.5 flex items-baseline justify-between gap-2">
                    <span className="text-xs font-bold text-white">{factor.label}</span>
                    <span className="shrink-0 font-mono text-[11px] text-slate-400">
                      {factor.score}/{factor.max}
                    </span>
                  </div>
                  <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`meter-fill h-full rounded-full ${
                        pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-rose-500"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-400">{factor.detail}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Model consensus */}
      {report.modelRuns && report.modelRuns.length > 0 && (
        <section className="animate-rise rounded-2xl border border-slate-800 bg-slate-900/50 p-5 md:p-6 print-card">
          <header className="mb-4 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Scale className="h-4 w-4 text-purple-400" />
            <h3 className="text-base font-bold text-white">Independent model verdicts</h3>
            <span className="ml-auto text-[11px] text-slate-500">
              {report.modelRuns.length === 1 ? "single model" : "same evidence, assessed separately"}
            </span>
          </header>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {report.modelRuns.map((run, i) => {
              const t = scoreTone(run.score);
              return (
                <div key={i} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-white">{run.label}</p>
                      <p className="truncate font-mono text-[10px] text-slate-500">{run.model}</p>
                    </div>
                    <span className={`shrink-0 text-2xl font-extrabold ${t.text}`}>{run.score}</span>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500">
                    responded in {(run.latencyMs / 1000).toFixed(1)}s
                  </p>
                </div>
              );
            })}
          </div>

          {report.secondOpinions && report.secondOpinions.length > 0 && (
            <div className="mt-4 space-y-3">
              {report.secondOpinions.map((op, i) => (
                <details key={i} className="group rounded-xl border border-slate-800 bg-slate-950/50 p-3.5">
                  <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-semibold text-slate-300">
                    <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
                    Second opinion from {op.label} (scored {op.score})
                  </summary>
                  <p className="mt-2.5 text-[13px] leading-relaxed text-slate-400">{op.verdict}</p>
                </details>
              ))}
            </div>
          )}

          {report.modelErrors && report.modelErrors.length > 0 && (
            <div className="mt-4 rounded-xl border border-rose-600/30 bg-rose-950/25 p-3">
              <p className="mb-1 text-xs font-bold text-rose-300">Some engines failed on this run</p>
              {report.modelErrors.map((e, i) => (
                <p key={i} className="break-words font-mono text-[10px] text-rose-400/80">
                  {e}
                </p>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Analysis */}
      <section className="animate-rise rounded-2xl border border-indigo-500/30 bg-slate-900/60 p-5 md:p-7 print-card">
        <header className="mb-5 flex items-center gap-2 border-b border-slate-800 pb-3">
          <FileText className="h-5 w-5 text-indigo-400" />
          <h3 className="font-display text-lg font-bold text-white">Analysis</h3>
          {sources.length > 0 && (
            <span className="no-print ml-auto rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
              {sources.length} sources cited
            </span>
          )}
        </header>
        {report.detailedAnalysis && renderFormattedReport(report.detailedAnalysis)}
      </section>

      {/* Verdict */}
      <section className="animate-rise rounded-2xl border border-slate-800 bg-slate-900/40 p-5 md:p-6 print-card">
        <h3 className="mb-2 text-base font-bold text-white">Executive verdict</h3>
        <p className="text-sm font-medium leading-relaxed text-slate-300">{report.verdict}</p>
      </section>

      {/* Uncertainties */}
      {report.keyUncertainties && report.keyUncertainties.length > 0 && (
        <section className="animate-rise rounded-2xl border border-amber-700/30 bg-amber-950/20 p-5 md:p-6 print-card">
          <header className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <h3 className="text-base font-bold text-white">What could not be verified</h3>
          </header>
          <p className="mb-3 text-xs text-amber-200/70">
            The models flagged these as gaps the retrieved evidence did not cover. Close them before
            committing capital.
          </p>
          <ul className="space-y-2 stagger">
            {report.keyUncertainties.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[13px] text-amber-100/90">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Risk matrix */}
      <section className="animate-rise rounded-2xl border border-slate-800 bg-slate-900/40 p-5 md:p-6 print-card">
        <header className="mb-4 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-amber-400" />
          <h3 className="text-base font-bold text-white">Four-vector risk assessment</h3>
        </header>
        <div className="grid grid-cols-2 gap-3 text-xs lg:grid-cols-4">
          {[
            { label: "Technical difficulty", value: report.riskMatrix.technicalComplexity, cls: "text-white" },
            { label: "Supply chain risk", value: report.riskMatrix.supplyChainRisk, cls: "text-amber-400" },
            { label: "Capital intensity", value: report.riskMatrix.capitalIntensity, cls: "text-indigo-400" },
            { label: "Regulatory barrier", value: report.riskMatrix.regulatoryBarrier, cls: "text-purple-400" },
          ].map((cell) => (
            <div key={cell.label} className="rounded-xl border border-slate-800 bg-slate-950 p-3">
              <span className="block text-slate-400">{cell.label}</span>
              <span className={`mt-0.5 block text-sm font-bold ${cell.cls}`}>{cell.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Financials */}
      <section className="animate-rise rounded-2xl border border-slate-800 bg-slate-900/40 p-5 md:p-6 print-card">
        <header className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-400" />
          <h3 className="text-base font-bold text-white">Financial viability (₹ INR)</h3>
        </header>
        <div className="grid grid-cols-2 gap-3 text-xs lg:grid-cols-4">
          {[
            { label: "Estimated COGS", value: report.financialViability.estimatedCogs, cls: "text-emerald-400" },
            { label: "Projected margin", value: report.financialViability.projectedMargin, cls: "text-white" },
            { label: "Break-even time", value: report.financialViability.breakEvenMonths, cls: "text-indigo-400" },
            { label: "Suggested MSRP", value: report.financialViability.recommendedRetailPrice, cls: "text-purple-400" },
          ].map((cell) => (
            <div key={cell.label} className="rounded-xl border border-slate-800 bg-slate-950 p-3">
              <span className="block text-slate-400">{cell.label}</span>
              <span className={`mt-0.5 block text-sm font-bold ${cell.cls}`}>{cell.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* BOM + action plan */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <section className="animate-rise rounded-2xl border border-slate-800 bg-slate-900/40 p-5 md:p-6 print-card">
          <header className="mb-3 flex items-center gap-2">
            <Boxes className="h-4 w-4 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Bill of materials outline</h3>
          </header>
          {report.billOfMaterials.length > 0 ? (
            <div className="space-y-1.5">
              {report.billOfMaterials.map((bom, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 border-b border-slate-800/60 py-1.5 text-xs"
                >
                  <span className="min-w-0 text-slate-300">{bom.item}</span>
                  <span className="shrink-0 font-bold text-emerald-400">{bom.estimatedCost}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">No bill of materials was produced for this pitch.</p>
          )}
        </section>

        <section className="animate-rise rounded-2xl border border-slate-800 bg-slate-900/40 p-5 md:p-6 print-card">
          <header className="mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Recommended action plan</h3>
          </header>
          <div className="space-y-2.5 stagger">
            {report.actionPlan.map((step, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-[10px] font-bold text-indigo-400">
                  {idx + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Sources */}
      <SourcesPanel report={report} sources={sources} />

      {/* Comparables */}
      {report.comparablePitches && report.comparablePitches.length > 0 && (
        <section className="animate-rise rounded-2xl border border-slate-800 bg-slate-900/40 p-5 md:p-6 print-card">
          <header className="mb-3 flex items-center gap-2">
            <History className="h-4 w-4 text-slate-400" />
            <h3 className="text-base font-bold text-white">Comparable pitches assessed here before</h3>
          </header>
          <p className="mb-3 text-xs text-slate-500">
            Used to calibrate this verdict against precedent. This set grows every time someone runs
            an assessment.
          </p>
          <div className="space-y-2">
            {report.comparablePitches.map((c, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs"
              >
                <span className="min-w-0 truncate text-slate-300">{c.title}</span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="text-[10px] text-slate-500">{c.similarity}% similar</span>
                  <span className={`font-bold ${scoreTone(c.score).text}`}>{c.score}</span>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Sources panel                                                       *
 * ------------------------------------------------------------------ */

const SOURCE_TYPE_STYLE: Record<string, string> = {
  "official-statistics": "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  academic: "border-sky-500/30 bg-sky-500/10 text-sky-400",
  encyclopedia: "border-violet-500/30 bg-violet-500/10 text-violet-400",
  "community-signal": "border-amber-500/30 bg-amber-500/10 text-amber-400",
};

function SourcesPanel({ report, sources }: { report: AssessmentReport; sources: CitedSource[] }) {
  const meta = report.evidenceMeta;

  return (
    <section className="animate-rise rounded-2xl border border-slate-800 bg-slate-900/40 p-5 md:p-6 print-card">
      <header className="mb-4 flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <Globe className="h-4 w-4 text-emerald-400" />
        <h3 className="text-base font-bold text-white">Sources consulted</h3>
        <span className="ml-auto text-[11px] text-slate-500">
          {sources.length} retrieved
          {meta && ` in ${(meta.durationMs / 1000).toFixed(1)}s`}
          {meta?.cached && " (cached)"}
        </span>
      </header>

      {meta && meta.queryTerms.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-500">Searched for:</span>
          {meta.queryTerms.map((term) => (
            <span
              key={term}
              className="rounded border border-slate-700 bg-slate-950 px-1.5 py-0.5 font-mono text-[10px] text-slate-400"
            >
              {term}
            </span>
          ))}
        </div>
      )}

      {sources.length === 0 ? (
        <p className="rounded-xl border border-amber-600/30 bg-amber-950/25 p-3 text-xs text-amber-200">
          No external sources were retrieved for this pitch, so the figures above are unverified
          model estimates. Treat them as directional only.
        </p>
      ) : (
        <ol className="space-y-2.5 stagger">
          {sources.map((source, idx) => (
            <li
              key={source.url + idx}
              className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 transition-colors hover:border-slate-700"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-indigo-500/30 bg-indigo-500/15 text-[11px] font-bold text-indigo-300 print-badge">
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${
                        SOURCE_TYPE_STYLE[source.sourceType] ||
                        "border-slate-600 bg-slate-800 text-slate-400"
                      }`}
                    >
                      {source.source}
                    </span>
                    <span className="text-[10px] text-slate-600">
                      retrieved {new Date(source.retrievedAt).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-start gap-1.5 text-[13px] font-semibold text-indigo-300 transition-colors hover:text-indigo-200 hover:underline"
                  >
                    <Link2 className="mt-0.5 h-3 w-3 shrink-0" />
                    <span className="min-w-0">{source.title}</span>
                  </a>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">{source.snippet}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}

      {meta && meta.failures.length > 0 && (
        <details className="no-print group mt-4">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 text-[11px] text-slate-500 hover:text-slate-400">
            <ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180" />
            {meta.failures.length} source{meta.failures.length === 1 ? "" : "s"} returned nothing usable
          </summary>
          <ul className="mt-2 space-y-1 pl-4">
            {meta.failures.map((f, i) => (
              <li key={i} className="text-[11px] text-slate-500">
                <span className="font-semibold text-slate-400">{f.source}</span> — {f.reason}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
