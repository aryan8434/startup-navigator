"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { UserRound, Loader2 } from "lucide-react";
import {
  startGuestSession,
  SESSION_CHANGE_EVENT,
  GUEST_SESSION_LABEL,
  type SessionUser,
} from "@/lib/guest-session";

/**
 * Slim banner for pipeline pages. The feature itself never requires a login;
 * this only tells anonymous visitors they can keep a history of their runs by
 * continuing as a guest, and reminds guests where those runs are saved.
 * Renders nothing for signed-in users.
 */
export default function GuestModeNotice({ feature }: { feature: string }) {
  const [session, setSession] = useState<SessionUser | null | undefined>(undefined);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetch("/api/auth/me")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => !cancelled && setSession(d?.user ?? null))
        .catch(() => !cancelled && setSession(null));

    load();
    window.addEventListener(SESSION_CHANGE_EVENT, load);
    return () => {
      cancelled = true;
      window.removeEventListener(SESSION_CHANGE_EVENT, load);
    };
  }, []);

  const handleContinueAsGuest = async () => {
    setStarting(true);
    try {
      const user = await startGuestSession();
      if (user) setSession(user);
    } finally {
      setStarting(false);
    }
  };

  if (session === undefined || (session && session.role !== "guest")) return null;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-amber-500/25 bg-amber-500/5 p-3.5 text-xs sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2.5 text-slate-300">
        <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
        {session ? (
          <p>
            <span className="font-semibold text-amber-300">Guest mode.</span> You get the same pipeline
            as signed-in founders. Your {feature} are saved to your{" "}
            <Link href="/dashboard" className="text-indigo-400 hover:underline">guest dashboard</Link> for{" "}
            {GUEST_SESSION_LABEL}.
          </p>
        ) : (
          <p>
            <span className="font-semibold text-white">No account needed.</span> You can run {feature} right
            now. Continue as a guest to keep them in a dashboard, or{" "}
            <Link href="/login" className="text-indigo-400 hover:underline">sign in</Link>.
          </p>
        )}
      </div>

      {session ? (
        <Link
          href="/register"
          className="shrink-0 rounded-lg border border-slate-700 px-3 py-1.5 text-center font-semibold text-white transition hover:bg-slate-800"
        >
          Create account to keep them
        </Link>
      ) : (
        <button
          type="button"
          onClick={handleContinueAsGuest}
          disabled={starting}
          className="flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 font-semibold text-amber-300 transition hover:bg-amber-500/20 disabled:opacity-50"
        >
          {starting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Continue as guest
        </button>
      )}
    </div>
  );
}
