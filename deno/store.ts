/**
 * Yjs-backed key/value store.
 *
 * Drop-in replacement for `https://esm.town/v/pomdtr/kv` (`openKv`). Instead of
 * Val Town's SQLite KV, every value lives in the shared Yjs document (`@vals`)
 * that the sync job and the collaborative `<ts-editor>` already use. That makes
 * Yjs the single source of truth for the whole app:
 *
 *   - `content:<zon>:<file>`  -> stored in `doc.getText("<zon>:<file>")`, the
 *     exact Y.Text the live editor binds to, so saves/edits stay in sync.
 *   - every other key         -> stored in a top-level `doc.getMap("kv")`.
 *
 * The store connects to the same Hocuspocus server as the editor and waits for
 * the initial sync before reading, so a freshly started process sees whatever
 * previous runs / the cron sync persisted.
 */
import * as Y from "https://esm.sh/yjs@13.6.23?target=esnext";
import {
  HocuspocusProvider,
  HocuspocusProviderWebsocket,
} from "https://esm.sh/@hocuspocus/provider@2.15.0?&external=ws&target=esnext&yjs=13.6.23";
import config from "./config.json" with { type: "json" };

const ROOM = config.editor.yjs.room; // "@vals"
const URL = Deno.env.get("YJS_URL") || config.editor.yjs.url;

// WebSocket polyfill for the Deno / server runtime.
const WS = typeof WebSocket !== "undefined"
  ? WebSocket
  : (await import("https://esm.sh/ws?target=esnext")).default;

const CONTENT_PREFIX = "content:";
const KV_MAP = "kv";

let cached: { doc: Y.Doc; provider: HocuspocusProvider; ready: Promise<void> } | null = null;

function connect() {
  if (cached) return cached;

  const doc = new Y.Doc({ guid: ROOM });
  const socket = new HocuspocusProviderWebsocket({ url: URL, WebSocketPolyfill: WS });
  const provider = new HocuspocusProvider({
    url: URL,
    name: ROOM,
    document: doc,
    websocketProvider: socket,
    preserveConnection: true,
    broadcast: true,
    forceSyncInterval: true,
    connect: true,
  });

  const ready = new Promise<void>((resolve) => {
    if (provider.isSynced) return resolve();
    provider.on("synced", () => resolve());
    // Safety net so a read never hangs forever if the server is unreachable.
    setTimeout(resolve, 10_000);
  });

  cached = { doc, provider, ready };
  return cached;
}

export interface Kv {
  get<T = unknown>(key: string): Promise<T | undefined>;
  set(key: string, value: unknown): Promise<void>;
  delete(key: string): Promise<void>;
  list(prefix?: string): Promise<string[]>;
  /** Wait until local changes have been flushed to the server. */
  flush(): Promise<void>;
}

async function get<T = unknown>(key: string): Promise<T | undefined> {
  const { doc, ready } = connect();
  await ready;
  if (key.startsWith(CONTENT_PREFIX)) {
    const text = doc.getText(key.slice(CONTENT_PREFIX.length)).toString();
    return (text ? text : undefined) as T | undefined;
  }
  const value = doc.getMap(KV_MAP).get(key);
  return (value === undefined ? undefined : value) as T | undefined;
}

async function set(key: string, value: unknown): Promise<void> {
  const { doc, ready } = connect();
  await ready;
  if (key.startsWith(CONTENT_PREFIX)) {
    const yText = doc.getText(key.slice(CONTENT_PREFIX.length));
    doc.transact(() => {
      yText.delete(0, yText.length);
      yText.insert(0, String(value ?? ""));
    });
    return;
  }
  doc.getMap(KV_MAP).set(key, value as any);
}

async function del(key: string): Promise<void> {
  const { doc, ready } = connect();
  await ready;
  if (key.startsWith(CONTENT_PREFIX)) {
    const yText = doc.getText(key.slice(CONTENT_PREFIX.length));
    doc.transact(() => yText.delete(0, yText.length));
    return;
  }
  doc.getMap(KV_MAP).delete(key);
}

async function list(prefix = ""): Promise<string[]> {
  const { doc, ready } = connect();
  await ready;
  const out: string[] = [];
  for (const key of doc.getMap(KV_MAP).keys()) {
    if (key.startsWith(prefix)) out.push(key);
  }
  return out;
}

async function flush(): Promise<void> {
  const { provider, ready } = connect();
  await ready;
  // Wait until the provider reports no unsynced changes, then a short grace
  // period so the final websocket frame reaches the server before exit.
  const start = Date.now();
  while ((provider as any).hasUnsyncedChanges && Date.now() - start < 10_000) {
    await new Promise((r) => setTimeout(r, 100));
  }
  await new Promise((r) => setTimeout(r, 500));
}

/** Returns a Yjs-backed KV handle with the pomdtr/kv interface. */
export function openKv(): Kv {
  return { get, set, delete: del, list, flush };
}

/**
 * Returns the shared `@vals` Yjs document (connected to the same Hocuspocus
 * server as the editor), waiting for the initial sync. Use this when you need
 * direct access to Y.Map / Y.Text structures instead of the KV interface.
 */
export async function getDoc(): Promise<Y.Doc> {
  const { doc, ready } = connect();
  await ready;
  return doc;
}

export default openKv;
