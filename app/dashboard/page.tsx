"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { 
  UserCheck, 
  Mail, 
  Calendar, 
  History, 
  Search, 
  ArrowRight, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Loader2
} from "lucide-react";

interface SearchLog {
  id: string;
  query: string;
  answer: string;
  timestamp: string;
  resolvedSources: { id: string; title: string }[];
}

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
}

export default function UserDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<SearchLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [meRes, historyRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/search/history")
        ]);

        if (meRes.ok) {
          const meData = await meRes.json();
          setUser(meData.user);
        }

        if (historyRes.ok) {
          const historyData = await historyRes.json();
          setHistory(historyData.history || []);
        }
      } catch (error) {
        console.error("Dashboard load failed:", error);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedLog(expandedLog === id ? null : id);
  };

  const getDistinctTopicsCount = () => {
    const topics = new Set<string>();
    history.forEach((log) => {
      log.resolvedSources.forEach((src) => {
        // Just mock some category mapping since we only have titles here
        topics.add(src.title);
      });
    });
    return topics.size;
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="flex-grow flex items-center justify-center py-20">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
            <p className="text-sm text-slate-400">Loading user profile and history...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-left">
        {/* Header Title */}
        <div className="mb-10">
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white">
            Founder <span className="text-gradient">Dashboard</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Access your personalized search records, metrics, and startup files.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Column: Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="p-6 rounded-2xl glassmorphism bg-slate-900/10 border border-slate-800 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-full blur-xl"></div>
              
              {/* User Avatar Initials */}
              <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-900/50 border border-indigo-700/60 flex items-center justify-center mb-4">
                <span className="font-display font-extrabold text-xl text-indigo-300">
                  {user?.name ? user.name.split(" ").map((n) => n[0]).join("") : "U"}
                </span>
              </div>

              <h3 className="font-bold text-white text-lg">{user?.name}</h3>
              <span className="inline-flex items-center space-x-1 mt-1.5 px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-semibold text-slate-400 capitalize">
                <UserCheck className="h-3 w-3 text-indigo-400" />
                <span>{user?.role} Founder</span>
              </span>

              <hr className="border-slate-800/80 my-5" />

              <div className="space-y-3 text-left text-xs text-slate-400">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-slate-500 shrink-0" />
                  <span className="truncate">{user?.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-slate-500 shrink-0" />
                  <span>Joined {new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-900 bg-slate-950/40 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500">Searches</span>
                <p className="mt-1 text-2xl font-extrabold text-white">{history.length}</p>
              </div>
              <div className="p-4 rounded-xl border border-slate-900 bg-slate-950/40 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500">Topics</span>
                <p className="mt-1 text-2xl font-extrabold text-indigo-400">{getDistinctTopicsCount()}</p>
              </div>
            </div>
          </div>

          {/* Right Column: Search logs history list */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2 text-slate-400">
                <History className="h-5 w-5 text-indigo-400" />
                <h3 className="text-base font-semibold text-white">Your Query Logs</h3>
              </div>
              <Link
                href="/search"
                className="flex items-center space-x-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition"
              >
                <span>Ask new query</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {history.length > 0 ? (
              <div className="space-y-4">
                {history.map((log) => {
                  const isExpanded = expandedLog === log.id;
                  const formattedTime = new Date(log.timestamp).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  });

                  return (
                    <div 
                      key={log.id} 
                      className="rounded-xl border border-slate-900 bg-slate-950/20 overflow-hidden transition"
                    >
                      {/* Header block */}
                      <button
                        onClick={() => toggleExpand(log.id)}
                        className="w-full p-4 flex items-center justify-between hover:bg-slate-900/10 text-left transition cursor-pointer"
                      >
                        <div className="space-y-1 pr-4">
                          <h4 className="text-sm font-semibold text-white leading-tight">
                            {log.query}
                          </h4>
                          <span className="block text-[10px] text-slate-500">
                            {formattedTime}
                          </span>
                        </div>
                        <div className="shrink-0 text-slate-500 hover:text-white transition">
                          {isExpanded ? <ChevronUp className="h-4.5 w-4.5" /> : <ChevronDown className="h-4.5 w-4.5" />}
                        </div>
                      </button>

                      {/* Expanded Answer content */}
                      {isExpanded && (
                        <div className="p-4 bg-slate-900/30 border-t border-slate-900/80 text-xs sm:text-sm text-slate-300 space-y-4">
                          <div className="whitespace-pre-wrap leading-relaxed prose prose-invert max-w-none text-xs sm:text-sm">
                            {/* Render a truncated or direct preview of the stored answer */}
                            {log.answer}
                          </div>

                          {/* Render sources referenced */}
                          {log.resolvedSources.length > 0 && (
                            <div className="pt-4 border-t border-slate-900/60">
                              <span className="block text-[10px] uppercase font-bold text-slate-500 mb-2">Sources Checked:</span>
                              <div className="flex flex-wrap gap-2">
                                {log.resolvedSources.map((src) => (
                                  <Link
                                    key={src.id}
                                    href={`/articles/${src.id}`}
                                    className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-[10px] text-indigo-400 hover:text-indigo-300 font-medium transition"
                                  >
                                    <span>{src.title}</span>
                                    <ExternalLink className="h-2.5 w-2.5" />
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center border border-dashed border-slate-900 bg-slate-950/10 rounded-2xl">
                <Search className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                <h4 className="text-sm font-semibold text-white">No query logs found</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                  Start using the RAG AI search bar to clear your path. Your logs will compile here.
                </p>
                <Link
                  href="/search"
                  className="mt-6 inline-flex px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition text-xs font-semibold"
                >
                  Consult AI Navigator
                </Link>
              </div>
            )}
          </div>

        </div>
      </main>

      <Footer />
    </>
  );
}
