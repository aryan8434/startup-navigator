"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, Rocket, LogOut, LayoutDashboard, Cpu } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch session status on mount and when pathname changes (user signs in/out)
  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (e) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [pathname]);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        setUser(null);
        router.push("/login");
        router.refresh();
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Idea Explorer", href: "/ideas" },
    { name: "AI Feasibility", href: "/feasibility" },
    { name: "Cost Calculator", href: "/calculator" },
    { name: "Guides", href: "/explore" },
    { name: "Resources", href: "/resources" },
    { name: "AI Search", href: "/search" },
  ];

  return (
    <nav className="sticky top-0 z-50 glassmorphism border-b border-slate-800 bg-slate-950/70 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 group">
              <Rocket className="h-6 w-6 text-indigo-500 group-hover:text-purple-400 transition-colors duration-300" />
              <span className="font-display font-bold text-xl tracking-tight text-white">
                Nxt<span className="text-indigo-500 group-hover:text-purple-400 transition-colors duration-300">Venture</span>
              </span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center space-x-5">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-xs font-medium transition-colors duration-200 hover:text-indigo-400 ${
                    isActive ? "text-indigo-400 font-bold border-b-2 border-indigo-500 pb-0.5" : "text-slate-300"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Right Section: User Auth & Architecture Button on top right of Sign Out */}
          <div className="hidden md:flex items-center space-x-3">
            {!loading && (
              <>
                {user ? (
                  <div className="flex items-center space-x-2.5">
                    <Link
                      href="/dashboard"
                      className="flex items-center space-x-1.5 text-xs font-bold text-white px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 transition"
                    >
                      <LayoutDashboard className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Dashboard</span>
                    </Link>
                    {/* Standard non-flashy Sign Out button */}
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-1 text-xs px-3 py-1.5 rounded-lg text-slate-300 hover:text-rose-400 border border-slate-800 hover:border-slate-700 transition cursor-pointer"
                      title="Sign Out"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Link
                      href="/login"
                      className="text-xs font-medium text-slate-300 hover:text-white px-2 py-1 transition"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      className="text-xs px-3.5 py-1.5 rounded-lg text-white bg-indigo-600 hover:bg-indigo-500 font-bold transition shadow-md"
                    >
                      <span>Get Started</span>
                    </Link>
                  </div>
                )}
              </>
            )}

            {/* Top Right Flashy Architecture & Docs Button (To the right of Sign Out) */}
            <Link
              href="/architecture"
              className="text-xs px-3.5 py-1.5 rounded-lg text-white flashy-pulse-btn shadow-xl transition flex items-center space-x-1.5 font-extrabold"
            >
              <span>⚡ Architecture & Docs</span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-900 focus:outline-none transition cursor-pointer"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden glassmorphism border-b border-slate-800 bg-slate-950/95">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive
                      ? "bg-indigo-600/10 text-indigo-400"
                      : "text-slate-300 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
            <hr className="border-slate-800 my-2" />
            {!loading && (
              <div className="px-3 py-2 space-y-2">
                {user ? (
                  <>
                    <div className="text-slate-400 text-sm py-1">
                      Logged in as: <span className="text-white font-medium">{user.name}</span>
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center space-x-2 py-2 text-slate-300 hover:text-white"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                    <Link
                      href="/architecture"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center space-x-2 py-2 text-indigo-400 font-bold"
                    >
                      <Cpu className="h-4 w-4" />
                      <span>⚡ Architecture & Docs</span>
                    </Link>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleLogout();
                      }}
                      className="flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-slate-300 hover:text-rose-400 border border-slate-800 cursor-pointer w-full text-center"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col space-y-2">
                    <Link
                      href="/architecture"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-center py-2 rounded-md text-white font-bold flashy-pulse-btn transition"
                    >
                      ⚡ Architecture & Docs
                    </Link>
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-center py-2 rounded-md text-slate-300 hover:bg-slate-900 hover:text-white transition"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-center py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition"
                    >
                      Get Started / Register
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
