"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserRound, Loader2 } from "lucide-react";
import { startGuestSession } from "@/lib/guest-session";

/**
 * "or continue as guest" block for the login and register cards. Starts a
 * guest session and drops the visitor straight into the feasibility pipeline.
 */
export default function ContinueAsGuestButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleClick = async () => {
    setError("");
    setLoading(true);
    try {
      const user = await startGuestSession();
      if (!user) {
        setError("Could not start a guest session. Try again.");
        return;
      }
      router.refresh();
      router.push("/feasibility");
    } catch {
      setError("Server connection failed. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-5">
      <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
        <span className="h-px flex-1 bg-slate-800" />
        <span>or</span>
        <span className="h-px flex-1 bg-slate-800" />
      </div>

      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="mt-5 flex w-full cursor-pointer items-center justify-center space-x-2 rounded-xl border border-slate-700 bg-slate-900/60 py-3 text-sm font-semibold text-slate-200 transition duration-200 hover:border-slate-600 hover:bg-slate-800 disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserRound className="h-4 w-4 text-amber-400" />}
        <span>{loading ? "Starting guest session..." : "Continue as Guest"}</span>
      </button>

      <p className="mt-2 text-center text-[11px] leading-relaxed text-slate-500">
        Run AI feasibility audits and generate AI ideas with the same two-model pipeline. No account needed.
      </p>

      {error && <p className="mt-2 text-center text-[11px] text-red-400">{error}</p>}
    </div>
  );
}
