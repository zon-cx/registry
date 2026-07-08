/**
 * Object-store backed drop-in replacement for `https://esm.town/v/pomdtr/kv`.
 *
 * Instead of Val Town's SQLite KV (which namespaces data per-val and does not
 * persist/share across local processes), this uses Val Town's Blob storage —
 * an S3-style object store keyed by strings. Because it is a remote object
 * store, the same data is visible to every process (the `sync` job, the web
 * server, one-off scripts), which is exactly what this app needs.
 *
 * The public API mirrors `openKv()` so existing call sites only change their
 * import path:
 *
 *   const kv = openKv();
 *   await kv.set("zons:list", value);   // JSON object stored as a blob
 *   const value = await kv.get("zons:list");
 *   await kv.list("file:");             // keys with a given prefix
 *   await kv.delete("file:foo");
 */

const API_URL = "https://api.val.town";

// All keys live under this object-store prefix so they form a clean, isolated
// "bucket" and never collide with other blobs on the account.
const NAMESPACE = "registry/";

function token(): string {
  const t = Deno.env.get("VAL_TOWN_API_KEY") ?? Deno.env.get("valtown");
  if (!t) {
    throw new Error(
      "Missing Val Town token: set VAL_TOWN_API_KEY (or `valtown`) in the environment.",
    );
  }
  return t;
}

function authHeaders(): HeadersInit {
  return { Authorization: `Bearer ${token()}` };
}

function blobKey(key: string): string {
  return `${NAMESPACE}${key}`;
}

async function get<T = unknown>(key: string): Promise<T | undefined> {
  const res = await fetch(
    `${API_URL}/v1/blob/${encodeURIComponent(blobKey(key))}`,
    { headers: authHeaders() },
  );
  if (res.status === 404) return undefined;
  if (!res.ok) {
    throw new Error(`Blob get failed for "${key}": ${res.status} ${await res.text()}`);
  }
  const text = await res.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as T;
  } catch {
    // Stored as a plain (non-JSON) string.
    return text as unknown as T;
  }
}

async function set(key: string, value: unknown): Promise<void> {
  const body = typeof value === "string" ? value : JSON.stringify(value);
  const res = await fetch(
    `${API_URL}/v1/blob/${encodeURIComponent(blobKey(key))}`,
    { method: "POST", headers: authHeaders(), body },
  );
  if (!res.ok) {
    throw new Error(`Blob set failed for "${key}": ${res.status} ${await res.text()}`);
  }
}

async function del(key: string): Promise<void> {
  const res = await fetch(
    `${API_URL}/v1/blob/${encodeURIComponent(blobKey(key))}`,
    { method: "DELETE", headers: authHeaders() },
  );
  if (!res.ok && res.status !== 404) {
    throw new Error(`Blob delete failed for "${key}": ${res.status} ${await res.text()}`);
  }
}

async function list(prefix = ""): Promise<string[]> {
  const fullPrefix = blobKey(prefix);
  const res = await fetch(
    `${API_URL}/v1/blob?prefix=${encodeURIComponent(fullPrefix)}`,
    { headers: authHeaders() },
  );
  if (!res.ok) {
    throw new Error(`Blob list failed for "${prefix}": ${res.status} ${await res.text()}`);
  }
  const entries = (await res.json()) as { key: string }[];
  // Strip the namespace prefix so callers see their original keys.
  return entries.map((e) => e.key.slice(NAMESPACE.length));
}

export interface Kv {
  get<T = unknown>(key: string): Promise<T | undefined>;
  set(key: string, value: unknown): Promise<void>;
  delete(key: string): Promise<void>;
  list(prefix?: string): Promise<string[]>;
}

/** Returns an object-store-backed KV handle with the pomdtr/kv interface. */
export function openKv(): Kv {
  return { get, set, delete: del, list };
}
