/**
 * MOCK DATABASE (development only)
 * ------------------------------------------------------------------
 * In mock mode there is no dashboard, so customers, orders, contact messages and custom orders are saved in a small JSON file:
 *     .mock-db/db.json   (created automatically, ignored by git)
 * This way accounts, saved addresses and order history survive restarting "npm run dev".
 * Delete the folder to start fresh.
 *
 * When the real API is connected (NEXT_PUBLIC_DATA_SOURCE=api) this file is not used —
 * the dashboard stores customers and orders.
 */
import "server-only";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { Customer, Order } from "@/types";
import type { ContactMessage } from "@/lib/validation/contact";
import type { CustomRequestInput } from "@/lib/validation/custom-request";

/** Customer as stored (with the private login fields the storefront never exposes) */
export interface StoredCustomer extends Customer {
  passwordHash?: string;
  googleId?: string;
  /** Set by the dashboard ("إيقاف الحساب") — the customer can't log in */
  disabled?: boolean;
}

interface Db {
  customers: StoredCustomer[];
  orders: Order[];
  /** idempotencyKey -> order number (stops double orders) */
  orderKeys: Record<string, string>;
  /** Contact-form messages (the dashboard's "رسائل التواصل" reads them via STOREFRONT_MOCK_DB) */
  contactMessages: StoredContactMessage[];
  /** "Design your piece" requests (the dashboard's "Customization requests" reads them). Photos: .mock-db/custom-photos/ */
  customRequests: StoredCustomRequest[];
}

export type StoredContactMessage = ContactMessage & { id: string; reference: string; createdAt: string };
export type StoredCustomRequest = CustomRequestInput & {
  id: string;
  reference: string;
  createdAt: string;
  /** File names inside .mock-db/custom-photos/ */
  photos: { file: string; type: string; size: number }[];
};

/**
 * Where the sample data is saved.
 *   - On your computer: the project's own ".mock-db" folder.
 *   - On Vercel (or any host whose project folder is read-only): its temporary folder (/tmp), so logging in and
 *     saving work for a DEMO. That folder is wiped whenever the host restarts the app, so changes don't last there.
 *   - MOCK_DB_DIR in the settings (.env.local / Vercel → Environment Variables) chooses another folder.
 */
const DIR = process.env.MOCK_DB_DIR || (process.env.VERCEL ? "/tmp/mock-db" : path.join(process.cwd(), ".mock-db"));
const FILE = path.join(DIR, "db.json");
/** Customers' photos for custom orders (private: only the dashboard shows them, to staff) */
export const CUSTOM_PHOTOS_DIR = path.join(DIR, "custom-photos");

function load(): Db {
  try {
    if (existsSync(FILE)) return { contactMessages: [], customRequests: [], ...(JSON.parse(readFileSync(FILE, "utf8")) as Partial<Db>) } as Db;
  } catch (error) {
    console.error("[mock-db] could not read db.json, starting empty", error);
  }
  return { customers: [], orders: [], orderKeys: {}, contactMessages: [], customRequests: [] };
}

/** Read the database, change it, save it (all synchronous so two requests can't overwrite each other) */
export function mutate<T>(fn: (db: Db) => T): T {
  const db = load();
  const result = fn(db);
  mkdirSync(DIR, { recursive: true });
  writeFileSync(FILE, JSON.stringify(db, null, 2), "utf8");
  return result;
}

export function read<T>(fn: (db: Db) => T): T {
  return fn(load());
}

/* ---------- passwords (scrypt; the real dashboard uses its own hashing) ---------- */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

export function verifyPassword(password: string, stored?: string): boolean {
  if (!stored) return false;
  const [salt, hash] = stored.split(":");
  const test = scryptSync(password, salt, 64);
  const original = Buffer.from(hash, "hex");
  return original.length === test.length && timingSafeEqual(original, test);
}

/** Remove private fields before sending a customer anywhere */
export function publicCustomer(c: StoredCustomer): Customer {
  const { passwordHash: _p, googleId: _g, disabled: _d, ...rest } = c;
  return rest;
}
