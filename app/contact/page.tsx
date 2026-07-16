"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Mail, MessageSquare, Clock, MapPin, Send, CheckCircle2 } from "lucide-react";

export default function Contact() {
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    setLoading(true);

    // Simulate network submission delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    setLoading(false);
    setSubmitted(true);
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <>
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-left">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-white">
            Contact &amp; <span className="text-gradient">Support</span>
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
            Have questions about incorporation, or need help with a RAG query? Drop us a note.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Contact Details sidebar */}
          <div className="md:col-span-1 space-y-6">
            <h3 className="text-lg font-bold text-white mb-4">Support Channels</h3>
            
            {/* Box 1 */}
            <div className="p-4 rounded-xl border border-slate-900 bg-slate-950/40 flex items-start space-x-3">
              <Mail className="h-5 w-5 text-indigo-400 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-white">Email Address</h4>
                <p className="text-xs text-slate-400 mt-1">support@startupnavigator.com</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Average reply time: &lt; 2 hours</p>
              </div>
            </div>

            {/* Box 2 */}
            <div className="p-4 rounded-xl border border-slate-900 bg-slate-950/40 flex items-start space-x-3">
              <Clock className="h-5 w-5 text-emerald-400 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-white">Operations Hours</h4>
                <p className="text-xs text-slate-400 mt-1">Monday — Friday</p>
                <p className="text-[10px] text-slate-500 mt-0.5">09:00 AM — 06:00 PM EST</p>
              </div>
            </div>

            {/* Box 3 */}
            <div className="p-4 rounded-xl border border-slate-900 bg-slate-950/40 flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-pink-400 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-white">Office Headquarters</h4>
                <p className="text-xs text-slate-400 mt-1">Delaware Incorporation Hub</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Wilmington, DE 19801</p>
              </div>
            </div>
          </div>

          {/* Form area */}
          <div className="md:col-span-2">
            <div className="p-6 rounded-2xl glassmorphism-card bg-slate-950/10 border border-slate-900">
              
              {submitted ? (
                <div className="py-12 text-center space-y-4">
                  <div className="inline-flex p-3 rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-900/60 mb-2">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Support Request Logged</h3>
                  <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Thank you! Your ticket has been logged in our system. A startup adviser will review your query and respond via email shortly.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-6 px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-sm transition cursor-pointer"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                        Name
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Founder name"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-900 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-sm transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="name@startup.com"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-900 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-sm transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="e.g. LLC Registration timeline"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-900 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-sm transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                      Message
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Detail your question or operational support request here..."
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-900 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-sm transition resize-none"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition duration-200 flex items-center justify-center space-x-2 cursor-pointer btn-gradient disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    <span>{loading ? "Logging request..." : "Send Message"}</span>
                  </button>
                </form>
              )}

            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
