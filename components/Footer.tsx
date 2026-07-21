import Link from "next/link";
import { Rocket, ShieldCheck, Heart } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-slate-900 bg-slate-950 py-12 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 text-white font-display font-bold text-lg mb-4">
              <Rocket className="h-5 w-5 text-indigo-500" />
              <span>Nxt<span className="text-indigo-500">Venture</span></span>
            </div>
            <p className="text-sm leading-relaxed max-w-sm">
              Your comprehensive full-stack interactive companion for launching high-growth companies. Explore guides on legal, branding, hiring, tax, fundraising, and leverage our RAG AI Search for instant navigation.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Sitemap</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-indigo-400 transition">Home</Link></li>
              <li><Link href="/explore" className="hover:text-indigo-400 transition">Explore Topics</Link></li>
              <li><Link href="/search" className="hover:text-indigo-400 transition">AI Search Assistant</Link></li>
              <li><Link href="/resources" className="hover:text-indigo-400 transition">Resource Templates</Link></li>
            </ul>
          </div>

          {/* Legal / About */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-indigo-400 transition">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-indigo-400 transition">Contact & Support</Link></li>
              <li className="flex items-center space-x-1.5 mt-4">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span className="text-xs text-slate-500">GDPR & CCPA Compliant</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <hr className="border-slate-900 my-8" />

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 space-y-4 sm:space-y-0">
          <div>
            &copy; {currentYear} NxtVenture. All rights reserved.
          </div>
          <div className="flex items-center space-x-1">
            <span>Crafted with</span>
            <Heart className="h-3 w-3 text-rose-500 animate-pulse" />
            <span>for founders globally.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
