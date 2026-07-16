import crypto from "crypto";
import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "default_super_secret_for_startup_navigator_2026";

export interface JWTPayload {
  id: string;
  email: string;
  role: "admin" | "user";
  name: string;
}

/**
 * Hashes a plain-text password using Node.js pbkdf2Sync
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verifies a plain-text password against a stored hash
 */
export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, originalHash] = stored.split(":");
    if (!salt || !originalHash) return false;
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
    return hash === originalHash;
  } catch (error) {
    return false;
  }
}

/**
 * Signs a JWT token containing user details
 */
export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });
}

/**
 * Verifies a JWT token and returns the payload or null if invalid
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Extracts and verifies the authenticated user from the request cookies
 */
export function getAuthenticatedUser(req: NextRequest): JWTPayload | null {
  const cookie = req.cookies.get("sn_session");
  if (!cookie) return null;
  return verifyToken(cookie.value);
}
