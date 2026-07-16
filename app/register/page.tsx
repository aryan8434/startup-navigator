"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Lock, Mail, Rocket, ShieldAlert, User, Loader2 } from "lucide-react";

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        router.refresh();
        if (data.user.role === "admin") {
          router.push("/admin");
        } else {
          router.push("/dashboard");
        }
      } else {
        setError(data.error || "Could not register user. Try again.");
      }
    } catch (err) {
      console.error(err);
      setError("Server connection failed. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <main className="flex-grow flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-md glassmorphism border border-slate-900 rounded-2xl p-8 text-left relative overflow-hidden">
          {/* Logo badge */}
          <div className="flex flex-col items-center mb-6">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-indigo-500 mb-3">
              <Rocket className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-display font-bold text-white">Create Account</h2>
            <p className="text-xs text-slate-400 mt-1">First registered user gains administrative credentials</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-900/60 text-red-400 text-xs flex items-center space-x-2">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-900 focus:border-indigo-500 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none text-sm transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-900 focus:border-indigo-500 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none text-sm transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="•••••••• (Min 6 chars)"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-900 focus:border-indigo-500 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none text-sm transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 bg-indigo-650 hover:bg-indigo-600 text-white font-semibold rounded-xl transition duration-200 cursor-pointer btn-gradient flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <span>Register</span>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="text-indigo-400 hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </>
  );
}
