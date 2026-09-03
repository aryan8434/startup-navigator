"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { 
  Search, 
  Sparkles, 
  BookOpen, 
  History, 
  ArrowRight, 
  Cpu, 
  HelpCircle,
  Clock,
  ExternalLink,
  Loader2,
  Globe
} from "lucide-react";

interface SearchLog {
  id: string;
  query: string;
  answer: string;
  timestamp: string;
  resolvedSources: { id: string; title: string }[];
}

const SUGGESTED_QUESTIONS = [
  "How should I split founder equity and structure vesting?",
  "What are the differences between Delaware LLC and C-Corp?",
  "How do I compute Customer Acquisition Cost (CAC) and LTV?",
  "What is the Delaware S-Corp tax exemption criteria?",
  "How can I set up an Employee Stock Option Pool (ESOP)?"
];

export default function AISearch() {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<{ id: string; title: string }[]>([]);
  // Live external citations retrieved for this answer, separate from the
  // internal guide matches above.
  const [webSources, setWebSources] = useState<{ title: string; url: string; source: string }[]>([]);
  const [providerUsed, setProviderUsed] = useState("");
  const [searchHistory, setSearchHistory] = useState<SearchLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [aiModel, setAiModel] = useState<"groq" | "gemini">("groq");
  const [engines, setEngines] = useState<
    { provider: string; reachable: boolean; workingModel: string | null }[] | null
  >(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => !cancelled && setEngines(d.providers || []))
      .catch(() => !cancelled && setEngines([]));
    return () => {
      cancelled = true;
    };
  }, []);

  // Load search history if logged in
  const loadHistory = async () => {
    try {
      const res = await fetch("/api/search/history");
      if (res.ok) {
        const data = await res.json();
        setSearchHistory(data.history || []);
        setIsUserLoggedIn(true);
      } else {
        setIsUserLoggedIn(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setHasSearched(true);
    setQuery(searchQuery);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery, aiModel })
      });

      if (res.ok) {
        const data = await res.json();
        setAnswer(data.answer);
        setWebSources(data.webSources || []);
        setProviderUsed(data.providerUsed || "");

        // Resolve sources details
        const articlesRes = await fetch("/api/articles");
        if (articlesRes.ok) {
          const articlesData = await articlesRes.json();
          const articlesMap = new Map<string, any>(articlesData.articles.map((a: any) => [a.id, a]));
          const resolved = data.sources
            .map((id: string) => {
              const article = articlesMap.get(id);
              return article ? { id: article.id, title: article.title } : null;
            })
            .filter((s: any) => s !== null);
          setSources(resolved);
        } else {
          setSources([]);
        }

        // Reload history
        loadHistory();
      } else {
        setAnswer("Sorry, we encountered an error while resolving your AI search. Please try again.");
        setSources([]);
      }
    } catch (error) {
      console.error("AI search failed:", error);
      setAnswer("Could not connect to search servers. Check your connection and try again.");
      setSources([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper to render markdown in the search results.
  // Walks the lines rather than mapping them, because tables are multi-line
  // blocks — models reach for them constantly when comparing sourced figures,
  // and without this they rendered as raw pipe characters.
  const renderMarkdown = (text: string) => {
    const lines = text.split("\n");
    const blocks: React.ReactNode[] = [];
    let i = 0;

    const isTableRow = (l: string) => /^\s*\|.*\|\s*$/.test(l);
    const isTableDivider = (l: string) => /^\s*\|[\s:|-]+\|\s*$/.test(l);
    const splitRow = (l: string) =>
      l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());

    while (i < lines.length) {
      const line = lines[i];

      if (isTableRow(line) && i + 1 < lines.length && isTableDivider(lines[i + 1])) {
        const header = splitRow(line);
        i += 2;
        const rows: string[][] = [];
        while (i < lines.length && isTableRow(lines[i])) {
          rows.push(splitRow(lines[i]));
          i++;
        }

        blocks.push(
          <div key={`t-${i}`} className="scroll-x my-4 rounded-xl border border-slate-800">
            <table className="w-full min-w-[420px] border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-900/80">
                  {header.map((cell, ci) => (
                    <th key={ci} className="border-b border-slate-800 px-3 py-2 font-bold text-white">
                      {parseInlineBold(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={ri} className="even:bg-slate-900/30">
                    {row.map((cell, ci) => (
                      <td key={ci} className="border-b border-slate-800/60 px-3 py-2 align-top text-slate-300">
                        {parseInlineBold(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }

      blocks.push(renderMarkdownLine(line, i));
      i++;
    }

    return blocks;
  };

  const renderMarkdownLine = (line: string, idx: number) => {
    {
      const trimmed = line.trim();

      if (trimmed.startsWith("## ") && !trimmed.startsWith("### ")) {
        return <h2 key={idx} className="text-xl font-bold text-white mt-7 mb-3">{trimmed.substring(3)}</h2>;
      }
      if (trimmed.startsWith("### ")) {
        return <h3 key={idx} className="text-lg font-bold text-white mt-6 mb-3">{trimmed.substring(4)}</h3>;
      }
      if (trimmed.startsWith("#### ")) {
        return <h4 key={idx} className="text-base font-semibold text-indigo-300 mt-5 mb-2">{trimmed.substring(5)}</h4>;
      }
      if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
        return (
          <ul key={idx} className="list-disc pl-5 my-1 text-slate-300 text-sm">
            <li>{parseInlineBold(trimmed.substring(2))}</li>
          </ul>
        );
      }
      if (/^\d+\.\s+/.test(trimmed)) {
        const match = trimmed.match(/^\d+\.\s+/);
        return (
          <ol key={idx} className="list-decimal pl-5 my-1 text-slate-300 text-sm">
            <li>{parseInlineBold(trimmed.substring(match![0].length))}</li>
          </ol>
        );
      }
      if (trimmed === "") return <div key={idx} className="h-2" />;

      return <p key={idx} className="text-slate-300 text-sm leading-relaxed mb-3">{parseInlineBold(trimmed)}</p>;
    }
  };

  // Handles **bold** and *italic* in one pass. Bold is matched first so the
  // inner asterisks of a bold span are never mistaken for an italic marker,
  // which previously left a stray "*" at the end of italicised lines.
  const parseInlineBold = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g).filter(Boolean);
    return parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
        return <strong key={idx} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
        return <em key={idx} className="text-slate-400">{part.slice(1, -1)}</em>;
      }
      return <span key={idx}>{parseInlineCode(part)}</span>;
    });
  };

  const parseInlineCode = (text: string) => {
    const parts = text.split(/`([^`]+)`/g);
    return parts.map((part, idx) => {
      if (idx % 2 === 1) {
        return <code key={idx} className="bg-slate-900 border border-slate-800 px-1 py-0.5 rounded text-indigo-400 text-xs font-mono">{part}</code>;
      }
      return <span key={idx}>{parseInlineLinks(part)}</span>;
    });
  };

  // Models emit `[label](url)` freely; without this it rendered as literal text.
  const parseInlineLinks = (text: string) => {
    const parts = text.split(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g);
    const out: React.ReactNode[] = [];
    for (let i = 0; i < parts.length; i++) {
      // The split yields [before, label, url, before, label, url, ...].
      if (i % 3 === 1 && parts[i + 1]) {
        out.push(
          <a
            key={i}
            href={parts[i + 1]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 underline decoration-indigo-500/40 underline-offset-2 transition-colors hover:text-indigo-300"
          >
            {parts[i]}
          </a>
        );
        i++;
      } else if (i % 3 === 0) {
        out.push(parts[i]);
      }
    }
    return out;
  };

  return (
    <>
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Main Chat/Search Area */}
          <div className="lg:col-span-3 flex flex-col space-y-6">
            
            {/* Header info */}
            <div className="bg-slate-900/20 border border-slate-800/40 rounded-2xl p-6 glassmorphism text-left">
              <div className="flex items-center space-x-2 text-indigo-400 mb-2">
                <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" />
                <span className="text-sm font-semibold uppercase tracking-wider">Retrieval-Augmented Assistant</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white">
                Startup Navigator RAG AI
              </h1>
              <p className="text-slate-400 text-sm mt-1.5 leading-relaxed">
                Query our entire database of startup guides, legal documents, templates and manufacturing blueprints. Choose your AI Engine (Groq or Gemini).
              </p>
            </div>

            {/* AI Model Selector & Search Input Box */}
            <div className="space-y-3">
              {/* Model names come from the live health probe rather than being
                  hardcoded — the previously pinned ids were retired by both
                  vendors and the labels stayed wrong long after the calls broke. */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
                <span className="font-semibold text-slate-400">AI engine:</span>

                {([
                  { id: "groq" as const, name: "Groq", accent: "text-amber-400" },
                  { id: "gemini" as const, name: "Google Gemini", accent: "text-purple-400" },
                ]).map((opt) => {
                  const status = engines?.find((p) => p.provider === opt.id);
                  return (
                    <label key={opt.id} className="flex cursor-pointer items-center gap-1.5">
                      <input
                        type="radio"
                        name="searchAiModel"
                        checked={aiModel === opt.id}
                        onChange={() => setAiModel(opt.id)}
                        className="accent-indigo-500"
                      />
                      <span className={aiModel === opt.id ? `${opt.accent} font-bold` : "text-slate-400"}>
                        {opt.name}
                      </span>
                      {status?.workingModel && (
                        <span className="font-mono text-[10px] text-slate-500">{status.workingModel}</span>
                      )}
                      {status && (
                        <span
                          className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${
                            status.reachable
                              ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-400"
                              : "border-rose-500/25 bg-rose-500/10 text-rose-400"
                          }`}
                        >
                          {status.reachable ? "live" : "down"}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSearch(query);
                }}
                className="relative"
              >
                <div className="relative flex items-center bg-slate-900 border border-slate-800 rounded-2xl focus-within:border-indigo-500 overflow-hidden transition pr-2">
                  <Search className="absolute left-4 h-5 w-5 text-slate-500" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask a question (e.g. 'How do I set up equity vesting for early employees?')..."
                    className="w-full bg-transparent pl-12 pr-4 py-4 text-slate-100 placeholder-slate-500 focus:outline-none text-sm"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium text-xs transition flex items-center space-x-1 cursor-pointer disabled:opacity-50 btn-gradient"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Thinking...</span>
                      </>
                    ) : (
                      <>
                        <span>Search</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Answer Display */}
            {hasSearched ? (
              <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-6 glassmorphism-card text-left">
                {loading ? (
                  <div className="py-12 flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                    <p className="text-sm text-slate-400 animate-pulse">Consulting the Startup Navigator handbooks...</p>
                  </div>
                ) : (
                  <div>
                    {/* Answer content */}
                    <div className="prose prose-invert max-w-none text-slate-200">
                      {renderMarkdown(answer)}
                    </div>

                    {/* Citations / Sources */}
                    {sources.length > 0 && (
                      <div className="mt-8 pt-6 border-t border-slate-900/80">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center space-x-1.5">
                          <BookOpen className="h-3.5 w-3.5" />
                          <span>Sources Referenced:</span>
                        </h4>
                        <div className="flex flex-wrap gap-2.5">
                          {sources.map((src) => (
                            <Link
                              key={src.id}
                              href={`/articles/${src.id}`}
                              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-900 border border-slate-800/80 hover:border-slate-700 rounded-xl text-xs text-indigo-400 hover:text-indigo-300 font-medium transition cursor-pointer"
                            >
                              <span>{src.title}</span>
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Live external citations */}
                    {webSources.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-slate-900/80">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                          <Globe className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Live web sources ({webSources.length})</span>
                          {providerUsed && (
                            <span className="ml-auto normal-case tracking-normal text-[11px] text-slate-600">
                              via {providerUsed}
                            </span>
                          )}
                        </h4>
                        <ul className="space-y-2 stagger">
                          {webSources.map((src, i) => (
                            <li key={src.url + i}>
                              <a
                                href={src.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-start gap-2.5 rounded-xl border border-slate-800/80 bg-slate-900 px-3 py-2.5 text-xs transition-colors hover:border-slate-700"
                              >
                                <span className="mt-0.5 shrink-0 rounded border border-emerald-500/25 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                                  {src.source}
                                </span>
                                <span className="min-w-0 font-medium text-indigo-300">{src.title}</span>
                                <ExternalLink className="ml-auto mt-0.5 h-3 w-3 shrink-0 text-slate-600" />
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Suggested Questions Grid when not searched yet */
              <div className="space-y-4 text-left">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                  <HelpCircle className="h-4 w-4" />
                  <span>Suggested Search Topics:</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SUGGESTED_QUESTIONS.map((question, i) => (
                    <button
                      key={i}
                      onClick={() => handleSearch(question)}
                      className="p-4 text-left rounded-xl border border-slate-900 bg-slate-950/40 hover:bg-slate-900/20 hover:border-slate-800 text-slate-300 hover:text-white transition duration-200 text-xs sm:text-sm font-medium cursor-pointer"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar: Personal Search History (Only if logged in) */}
          <div className="lg:col-span-1 border-t lg:border-t-0 lg:border-l border-slate-900 lg:pl-6 pt-6 lg:pt-0 text-left">
            <div className="flex items-center space-x-2 text-slate-400 mb-4">
              <History className="h-4.5 w-4.5 text-indigo-400" />
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Search Logs</h3>
            </div>

            {!isUserLoggedIn ? (
              <div className="p-4 rounded-xl border border-slate-900 bg-slate-950/20 text-center">
                <Clock className="h-6 w-6 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500 leading-relaxed">
                  <Link href="/login" className="text-indigo-400 hover:underline">Sign In</Link> to save your query histories and access customized dashboard metrics.
                </p>
              </div>
            ) : historyLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-10 bg-slate-900/30 border border-slate-800/40 rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : searchHistory.length > 0 ? (
              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {searchHistory.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setQuery(item.query);
                      setAnswer(item.answer);
                      setSources(item.resolvedSources);
                      setHasSearched(true);
                    }}
                    className="w-full p-3 text-left rounded-xl border border-slate-900 hover:border-slate-800 bg-slate-950/30 hover:bg-slate-900/20 transition cursor-pointer group"
                  >
                    <span className="block text-slate-300 group-hover:text-indigo-400 text-xs font-medium truncate">
                      {item.query}
                    </span>
                    <span className="block text-[10px] text-slate-500 mt-1">
                      {new Date(item.timestamp).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center border border-dashed border-slate-900 rounded-xl text-slate-600 text-xs leading-relaxed">
                No previous queries log. Your searches will show up here.
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
