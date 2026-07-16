"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { 
  ShieldCheck, 
  BarChart3, 
  BookOpen, 
  FileText, 
  Users, 
  History, 
  Plus, 
  Trash2, 
  Edit2, 
  CheckCircle, 
  XCircle,
  Loader2,
  AlertTriangle
} from "lucide-react";

interface Stats {
  totalArticles: number;
  totalResources: number;
  totalSearches: number;
  totalUsers: number;
  categoryBreakdown: Record<string, number>;
  popularSearchQueries: { query: string; count: number }[];
  recentSearches: { id: string; query: string; timestamp: string; userName: string }[];
  recentUsers: { id: string; name: string; email: string; role: string; createdAt: string }[];
}

interface Article {
  id: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  tags: string[];
  createdAt: string;
}

interface Resource {
  id: string;
  title: string;
  description: string;
  type: string;
  category: string;
  createdAt: string;
}

const CATEGORIES = [
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

const RESOURCE_TYPES = ["Template", "Checklist", "Spreadsheet"];

export default function AdminDashboard() {
  const router = useRouter();
  
  // States
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<"stats" | "articles" | "resources" | "users" | "logs">("stats");
  
  const [stats, setStats] = useState<Stats | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Forms States
  const [showArticleForm, setShowArticleForm] = useState(false);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [articleForm, setArticleForm] = useState({
    title: "",
    category: "Company Registration",
    summary: "",
    content: "",
    tagsInput: ""
  });

  const [showResourceForm, setShowResourceForm] = useState(false);
  const [resourceForm, setResourceForm] = useState({
    title: "",
    description: "",
    type: "Template",
    category: "Company Registration"
  });

  const [notif, setNotif] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 1. Check admin privileges on mount
  useEffect(() => {
    async function checkAdmin() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user?.role === "admin") {
            setIsAdmin(true);
            loadData();
          } else {
            router.push("/dashboard");
          }
        } else {
          router.push("/login");
        }
      } catch (err) {
        router.push("/login");
      } finally {
        setLoadingAuth(false);
      }
    }
    checkAdmin();
  }, []);

  // 2. Fetch stats, articles, resources
  const loadData = async () => {
    setLoadingData(true);
    try {
      const [statsRes, articlesRes, resourcesRes] = await Promise.all([
        fetch("/api/stats"),
        fetch("/api/articles"),
        fetch("/api/resources")
      ]);

      if (statsRes.ok) {
        const d = await statsRes.json();
        setStats(d);
      }
      if (articlesRes.ok) {
        const d = await articlesRes.json();
        setArticles(d.articles);
      }
      if (resourcesRes.ok) {
        const d = await resourcesRes.json();
        setResources(d.resources);
      }
    } catch (e) {
      console.error(e);
      triggerNotification("error", "Failed to retrieve administrator metrics.");
    } finally {
      setLoadingData(false);
    }
  };

  const triggerNotification = (type: "success" | "error", msg: string) => {
    setNotif({ type, msg });
    setTimeout(() => setNotif(null), 4000);
  };

  // 3. Articles CRUD handlers
  const handleArticleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!articleForm.title || !articleForm.content || !articleForm.summary) return;
    setSubmitting(true);

    const payload = {
      title: articleForm.title,
      content: articleForm.content,
      category: articleForm.category,
      summary: articleForm.summary,
      tags: articleForm.tagsInput.split(",").map((t) => t.trim()).filter((t) => t !== "")
    };

    try {
      const url = editingArticleId ? `/api/articles/${editingArticleId}` : "/api/articles";
      const method = editingArticleId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        triggerNotification("success", editingArticleId ? "Article updated successfully" : "Article created successfully");
        setShowArticleForm(false);
        setEditingArticleId(null);
        setArticleForm({ title: "", category: "Company Registration", summary: "", content: "", tagsInput: "" });
        loadData();
      } else {
        const data = await res.json();
        triggerNotification("error", data.error || "Save article failed");
      }
    } catch (err) {
      triggerNotification("error", "Network connection failure during save");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditArticle = (art: Article) => {
    setEditingArticleId(art.id);
    setArticleForm({
      title: art.title,
      category: art.category,
      summary: art.summary,
      content: art.content,
      tagsInput: art.tags.join(", ")
    });
    setShowArticleForm(true);
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm("Are you sure you want to delete this startup guide?")) return;
    try {
      const res = await fetch(`/api/articles/${id}`, { method: "DELETE" });
      if (res.ok) {
        triggerNotification("success", "Article deleted successfully");
        loadData();
      } else {
        triggerNotification("error", "Could not delete article");
      }
    } catch (err) {
      triggerNotification("error", "Network error on delete request");
    }
  };

  // 4. Resources CRUD handlers
  const handleResourceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resourceForm.title || !resourceForm.description) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resourceForm)
      });

      if (res.ok) {
        triggerNotification("success", "Resource uploaded successfully");
        setShowResourceForm(false);
        setResourceForm({ title: "", description: "", type: "Template", category: "Company Registration" });
        loadData();
      } else {
        const data = await res.json();
        triggerNotification("error", data.error || "Save resource failed");
      }
    } catch (err) {
      triggerNotification("error", "Network error on save resource");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteResource = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template resource?")) return;
    try {
      const res = await fetch(`/api/resources/${id}`, { method: "DELETE" });
      if (res.ok) {
        triggerNotification("success", "Resource deleted successfully");
        loadData();
      } else {
        triggerNotification("error", "Could not delete resource");
      }
    } catch (err) {
      triggerNotification("error", "Network error on resource deletion");
    }
  };

  if (loadingAuth) {
    return (
      <>
        <Navbar />
        <main className="flex-grow flex items-center justify-center py-20">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
            <p className="text-sm text-slate-400">Verifying administrator credentials...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!isAdmin) return null;

  return (
    <>
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-left">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white flex items-center space-x-2">
              <ShieldCheck className="h-7 w-7 text-indigo-500" />
              <span>Admin <span className="text-gradient">Control Panel</span></span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Add database guides, log audit reports, and configure resources repository.
            </p>
          </div>

          <div className="flex space-x-2 shrink-0">
            <button
              onClick={() => {
                setEditingArticleId(null);
                setArticleForm({ title: "", category: "Company Registration", summary: "", content: "", tagsInput: "" });
                setShowArticleForm(true);
              }}
              className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition btn-gradient"
            >
              <Plus className="h-4 w-4" />
              <span>New Guide</span>
            </button>
            <button
              onClick={() => setShowResourceForm(true)}
              className="flex items-center space-x-1.5 px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold cursor-pointer transition"
            >
              <Plus className="h-4 w-4" />
              <span>New Template</span>
            </button>
          </div>
        </div>

        {/* Notifications Alert banner */}
        {notif && (
          <div className={`mb-6 p-4 rounded-xl border flex items-center space-x-3 text-sm ${
            notif.type === "success" 
              ? "bg-emerald-950/40 border-emerald-900/60 text-emerald-400" 
              : "bg-red-950/40 border-red-900/60 text-red-400"
          }`}>
            {notif.type === "success" ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
            <span>{notif.msg}</span>
          </div>
        )}

        {/* Tab menu */}
        <div className="flex border-b border-slate-900 mb-8 overflow-x-auto space-x-1">
          {[
            { id: "stats", label: "Analytics Overview", icon: BarChart3 },
            { id: "articles", label: "Manage Guides", icon: BookOpen },
            { id: "resources", label: "Manage Templates", icon: FileText },
            { id: "users", label: "User registry", icon: Users },
            { id: "logs", label: "Search logs audit", icon: History }
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-1.5 px-4 py-3 border-b-2 text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? "border-indigo-500 text-indigo-400"
                    : "border-transparent text-slate-400 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* LOADING DATA SPIN */}
        {loadingData ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4 bg-slate-900/10 border border-slate-900/40 rounded-2xl">
            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
            <p className="text-sm text-slate-500">Querying platform database...</p>
          </div>
        ) : (
          
          /* Tab Contents */
          <div className="space-y-6">
            
            {/* 1. ANALYTICS OVERVIEW */}
            {activeTab === "stats" && stats && (
              <div className="space-y-8">
                {/* 4 mini stat counters */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="p-5 rounded-xl border border-slate-900 bg-slate-950/20 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Total Guides</span>
                    <p className="mt-1 text-3xl font-extrabold text-white">{stats.totalArticles}</p>
                  </div>
                  <div className="p-5 rounded-xl border border-slate-900 bg-slate-950/20 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Templates / Checklists</span>
                    <p className="mt-1 text-3xl font-extrabold text-white">{stats.totalResources}</p>
                  </div>
                  <div className="p-5 rounded-xl border border-slate-900 bg-slate-950/20 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-500">AI Searches resolved</span>
                    <p className="mt-1 text-3xl font-extrabold text-indigo-400">{stats.totalSearches}</p>
                  </div>
                  <div className="p-5 rounded-xl border border-slate-900 bg-slate-950/20 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Users Registered</span>
                    <p className="mt-1 text-3xl font-extrabold text-emerald-400">{stats.totalUsers}</p>
                  </div>
                </div>

                {/* Popular Queries list & Category stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Category counts */}
                  <div className="p-6 rounded-xl border border-slate-900 bg-slate-950/20">
                    <h3 className="text-sm font-semibold text-white mb-4">Guides Distribution</h3>
                    <div className="space-y-2">
                      {Object.entries(stats.categoryBreakdown).map(([cat, val]) => (
                        <div key={cat} className="flex justify-between items-center text-xs text-slate-400 border-b border-slate-900/60 pb-2">
                          <span>{cat}</span>
                          <span className="font-semibold text-white px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Popular search queries */}
                  <div className="p-6 rounded-xl border border-slate-900 bg-slate-950/20">
                    <h3 className="text-sm font-semibold text-white mb-4">Top AI Searches</h3>
                    {stats.popularSearchQueries.length > 0 ? (
                      <div className="space-y-2">
                        {stats.popularSearchQueries.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs text-slate-400 border-b border-slate-900/60 pb-2">
                            <span className="truncate max-w-[240px] italic">"{item.query}"</span>
                            <span className="text-slate-500 font-semibold">{item.count} counts</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-600 text-center py-6">No queries logged yet</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 2. MANAGE GUIDES */}
            {activeTab === "articles" && (
              <div className="space-y-4">
                {articles.length > 0 ? (
                  <div className="overflow-x-auto border border-slate-900 rounded-xl bg-slate-950/20">
                    <table className="w-full text-sm text-slate-400">
                      <thead className="bg-slate-950 text-xs font-semibold text-slate-300 uppercase tracking-wider text-left border-b border-slate-900">
                        <tr>
                          <th className="px-6 py-4">Title</th>
                          <th className="px-6 py-4">Category</th>
                          <th className="px-6 py-4">Tags</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900/60">
                        {articles.map((art) => (
                          <tr key={art.id} className="hover:bg-slate-900/10">
                            <td className="px-6 py-4 font-semibold text-white truncate max-w-xs">{art.title}</td>
                            <td className="px-6 py-4 text-xs">{art.category}</td>
                            <td className="px-6 py-4 text-xs font-mono truncate max-w-[120px]">{art.tags.join(", ")}</td>
                            <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                              <button
                                onClick={() => handleEditArticle(art)}
                                className="inline-flex p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-indigo-400 border border-slate-800 cursor-pointer"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteArticle(art.id)}
                                className="inline-flex p-1.5 rounded-lg bg-slate-900 hover:bg-red-950/40 text-rose-500 border border-slate-800 cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-slate-500 py-10">No guides found. Click New Guide to create one.</p>
                )}
              </div>
            )}

            {/* 3. MANAGE TEMPLATES */}
            {activeTab === "resources" && (
              <div className="space-y-4">
                {resources.length > 0 ? (
                  <div className="overflow-x-auto border border-slate-900 rounded-xl bg-slate-950/20">
                    <table className="w-full text-sm text-slate-400">
                      <thead className="bg-slate-950 text-xs font-semibold text-slate-300 uppercase tracking-wider text-left border-b border-slate-900">
                        <tr>
                          <th className="px-6 py-4">Resource</th>
                          <th className="px-6 py-4">Type</th>
                          <th className="px-6 py-4">Category</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900/60">
                        {resources.map((res) => (
                          <tr key={res.id} className="hover:bg-slate-900/10">
                            <td className="px-6 py-4">
                              <div className="font-semibold text-white">{res.title}</div>
                              <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{res.description}</div>
                            </td>
                            <td className="px-6 py-4 text-xs font-mono">{res.type}</td>
                            <td className="px-6 py-4 text-xs">{res.category}</td>
                            <td className="px-6 py-4 text-right whitespace-nowrap">
                              <button
                                onClick={() => handleDeleteResource(res.id)}
                                className="inline-flex p-1.5 rounded-lg bg-slate-900 hover:bg-red-950/40 text-rose-500 border border-slate-800 cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-slate-500 py-10">No template files found. Click New Template to upload.</p>
                )}
              </div>
            )}

            {/* 4. USER REGISTRY */}
            {activeTab === "users" && stats && (
              <div className="space-y-4">
                <div className="overflow-x-auto border border-slate-900 rounded-xl bg-slate-950/20">
                  <table className="w-full text-sm text-slate-400">
                    <thead className="bg-slate-950 text-xs font-semibold text-slate-300 uppercase tracking-wider text-left border-b border-slate-900">
                      <tr>
                        <th className="px-6 py-4">Name</th>
                        <th className="px-6 py-4">Email</th>
                        <th className="px-6 py-4">System Role</th>
                        <th className="px-6 py-4">Joined Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/60">
                      {stats.recentUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-900/10">
                          <td className="px-6 py-4 font-semibold text-white">{u.name}</td>
                          <td className="px-6 py-4 text-xs font-mono">{u.email}</td>
                          <td className="px-6 py-4 text-xs">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase border ${
                              u.role === "admin" 
                                ? "bg-red-950/30 border-red-900/40 text-red-400" 
                                : "bg-indigo-950/30 border-indigo-900/40 text-indigo-400"
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs">
                            {new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 5. SEARCH LOGS AUDIT */}
            {activeTab === "logs" && stats && (
              <div className="space-y-4">
                {stats.recentSearches.length > 0 ? (
                  <div className="overflow-x-auto border border-slate-900 rounded-xl bg-slate-950/20">
                    <table className="w-full text-sm text-slate-400">
                      <thead className="bg-slate-950 text-xs font-semibold text-slate-300 uppercase tracking-wider text-left border-b border-slate-900">
                        <tr>
                          <th className="px-6 py-4">Founder Query</th>
                          <th className="px-6 py-4">Searched By</th>
                          <th className="px-6 py-4">Logged Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900/60">
                        {stats.recentSearches.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-900/10">
                            <td className="px-6 py-4 text-white font-medium italic">"{log.query}"</td>
                            <td className="px-6 py-4 text-xs">{log.userName}</td>
                            <td className="px-6 py-4 text-xs font-mono">
                              {new Date(log.timestamp).toLocaleString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-slate-500 py-10">No searches recorded in the audit logs yet.</p>
                )}
              </div>
            )}

          </div>
        )}

        {/* =======================================================
            ARTICLE MODAL FORM 
            ======================================================= */}
        {showArticleForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              
              <h3 className="text-lg font-bold text-white mb-4">
                {editingArticleId ? "Edit Curated Guide" : "Create New Curated Guide"}
              </h3>
              
              <form onSubmit={handleArticleSubmit} className="space-y-4 text-slate-300 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Title</label>
                  <input
                    type="text"
                    required
                    value={articleForm.title}
                    onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                    placeholder="e.g. Setting up ESOP pool allocations"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl focus:border-indigo-500 focus:outline-none transition text-sm text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Category</label>
                    <select
                      value={articleForm.category}
                      onChange={(e) => setArticleForm({ ...articleForm, category: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl focus:border-indigo-500 focus:outline-none transition text-sm text-slate-300"
                    >
                      {CATEGORIES.filter(c => c !== "All").map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Tags (Comma-separated)</label>
                    <input
                      type="text"
                      value={articleForm.tagsInput}
                      onChange={(e) => setArticleForm({ ...articleForm, tagsInput: e.target.value })}
                      placeholder="e.g. esop, equity, legal"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl focus:border-indigo-500 focus:outline-none transition text-sm text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Summary</label>
                  <input
                    type="text"
                    required
                    value={articleForm.summary}
                    onChange={(e) => setArticleForm({ ...articleForm, summary: e.target.value })}
                    placeholder="A brief 1-sentence synopsis of this guide..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl focus:border-indigo-500 focus:outline-none transition text-sm text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Content (Markdown compatible)</label>
                  <textarea
                    required
                    rows={8}
                    value={articleForm.content}
                    onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })}
                    placeholder="Provide full documentation markdown details. Use ### for subheadings."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl focus:border-indigo-500 focus:outline-none transition text-sm text-slate-100 font-sans resize-none"
                  ></textarea>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowArticleForm(false);
                      setEditingArticleId(null);
                    }}
                    className="px-4 py-2 bg-slate-950 border border-slate-800 text-slate-300 rounded-xl hover:text-white transition cursor-pointer text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl font-semibold transition cursor-pointer text-xs btn-gradient"
                  >
                    {submitting ? "Saving..." : "Save Guide"}
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

        {/* =======================================================
            RESOURCE MODAL FORM 
            ======================================================= */}
        {showResourceForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
              
              <h3 className="text-lg font-bold text-white mb-4">Create New Template Resource</h3>
              
              <form onSubmit={handleResourceSubmit} className="space-y-4 text-slate-300 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Title</label>
                  <input
                    type="text"
                    required
                    value={resourceForm.title}
                    onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
                    placeholder="e.g. Pitch deck pptx template"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl focus:border-indigo-500 focus:outline-none transition text-sm text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Resource Type</label>
                    <select
                      value={resourceForm.type}
                      onChange={(e) => setResourceForm({ ...resourceForm, type: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl focus:border-indigo-500 focus:outline-none transition text-sm text-slate-300"
                    >
                      {RESOURCE_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Category</label>
                    <select
                      value={resourceForm.category}
                      onChange={(e) => setResourceForm({ ...resourceForm, category: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl focus:border-indigo-500 focus:outline-none transition text-sm text-slate-300"
                    >
                      {CATEGORIES.filter(c => c !== "All").map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Description</label>
                  <textarea
                    required
                    rows={4}
                    value={resourceForm.description}
                    onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })}
                    placeholder="What is this checklist/template for?..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl focus:border-indigo-500 focus:outline-none transition text-sm text-slate-100 font-sans resize-none"
                  ></textarea>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowResourceForm(false)}
                    className="px-4 py-2 bg-slate-950 border border-slate-800 text-slate-300 rounded-xl hover:text-white transition cursor-pointer text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl font-semibold transition cursor-pointer text-xs btn-gradient"
                  >
                    {submitting ? "Uploading..." : "Upload"}
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

      </main>

      <Footer />
    </>
  );
}
