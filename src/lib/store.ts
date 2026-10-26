import { useEffect, useState, useSyncExternalStore } from "react";
import { buildSeed, type DB, type User } from "@/data/seed";

/** Mock in-memory DB persisted to localStorage. Swap for a real API service later. */
const KEY = "edutrack-db-v1";
let db: DB = buildSeed();
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) db = JSON.parse(raw);
  } catch { /* ignore */ }
}

export function update(fn: (d: DB) => DB) {
  db = fn(db);
  localStorage.setItem(KEY, JSON.stringify(db));
  listeners.forEach((l) => l());
}

export function resetDb() { update(() => buildSeed()); }

const serverSnap = buildSeed();
export function useDb(): DB {
  return useSyncExternalStore(
    (l) => { load(); listeners.add(l); l(); return () => listeners.delete(l); },
    () => { load(); return db; },
    () => serverSnap,
  );
}

// ---- auth ----
const AUTH = "edutrack-auth";
let session: User | null | undefined;
const authL = new Set<() => void>();
function readSession() {
  if (session === undefined && typeof window !== "undefined") {
    const id = localStorage.getItem(AUTH);
    load();
    session = db.users.find((u) => u.id === id) ?? null;
  }
  return session;
}
export function useSession(): User | null | undefined {
  const [s, setS] = useState<User | null | undefined>(undefined);
  useEffect(() => {
    const l = () => setS(readSession());
    authL.add(l); l();
    return () => { authL.delete(l); };
  }, []);
  return s;
}
export function login(email: string, password: string): User | null {
  load();
  const u = db.users.find((x) => x.email.toLowerCase() === email.toLowerCase() && x.active);
  if (!u || password !== "Password123!") return null;
  localStorage.setItem(AUTH, u.id);
  session = u;
  authL.forEach((l) => l());
  return u;
}
export function logout() {
  localStorage.removeItem(AUTH);
  session = null;
  authL.forEach((l) => l());
}
export const uid = () => Math.random().toString(36).slice(2, 9);
