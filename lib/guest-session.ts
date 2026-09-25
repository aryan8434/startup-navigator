/**
 * Client-side helpers for guest mode. Kept apart from lib/auth.ts, which pulls
 * in Node's crypto and jsonwebtoken and so cannot ship to the browser.
 */

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user" | "guest";
}

/** Fired on window whenever the session changes outside a navigation. */
export const SESSION_CHANGE_EVENT = "sn-session-change";

/** How long a guest keeps their dashboard, matching SESSION_MAX_AGE_SECONDS. */
export const GUEST_SESSION_LABEL = "24 hours";

/**
 * Starts (or resumes) a guest session and tells listeners such as the navbar.
 * Returns the session user, or null if the server refused.
 */
export async function startGuestSession(): Promise<SessionUser | null> {
  const res = await fetch("/api/auth/guest", { method: "POST" });
  if (!res.ok) return null;
  const data = await res.json();
  window.dispatchEvent(new Event(SESSION_CHANGE_EVENT));
  return data.user as SessionUser;
}
