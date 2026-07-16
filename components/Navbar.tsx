"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, Rocket, LogOut, LayoutDashboard, UserCheck, ShieldAlert } from "lucide-react";

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
    { name: "Explore Topics", href: "/explore" },
    { name: "AI Search", href: "/search" },
    { name: "Resources", href: "/resources" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
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
                Startup<span className="text-indigo-500 group-hover:text-purple-400 transition-colors duration-300">Navigator</span>
              </span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-sm font-medium transition-colors duration-200 hover:text-indigo-400 ${
                    isActive ? "text-indigo-500 font-semibold" : "text-slate-300"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* User Auth Section */}
          <div className="hidden md:flex items-center space-x-4">
            {!loading && (
              <>
                {user ? (
                  <div className="flex items-center space-x-4">
                    {user.role === "admin" && (
                      <Link
                        href="/admin"
                        className="flex items-center space-x-1 text-xs px-2.5 py-1 bg-red-950/40 text-red-400 border border-red-900/60 rounded-full hover:bg-red-900/40 transition"
                      >
                        <ShieldAlert className="h-3 w-3" />
                        <span>Admin</span>
                      </Link>
                    )}
                    <Link
                      href="/dashboard"
                      className="flex items-center space-x-1.5 text-sm text-slate-300 hover:text-white transition"
                    >
                      <LayoutDashboard className="h-4 w-4 text-indigo-400" />
                      <span>Dashboard</span>
                    </Link>
                    <span className="text-slate-500 text-xs">|</span>
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-1.5 text-sm text-slate-400 hover:text-rose-400 transition cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <Link
                      href="/login"
                      className="text-sm font-medium text-slate-300 hover:text-white transition"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      className="text-sm font-medium px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition duration-200 btn-gradient"
                    >
                      Get Started
                    </Link>
                  </div>
                )}
              </>
            )}
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
                    {user.role === "admin" && (
                      <Link
                        href="/admin"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center space-x-2 py-2 text-red-400 hover:text-red-300"
                      >
                        <ShieldAlert className="h-4 w-4" />
                        <span>Admin Panel</span>
                      </Link>
                    )}
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center space-x-2 py-2 text-slate-300 hover:text-white"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleLogout();
                      }}
                      className="flex items-center space-x-2 py-2 text-rose-400 hover:text-rose-300 cursor-pointer w-full text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col space-y-2">
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
                      className="block text-center py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-medium btn-gradient transition"
                    >
                      Get Started
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
