import {
  HocuspocusProvider,
  HocuspocusProviderWebsocket,
} from "@hocuspocus/provider";
import WebSocket from "ws";
import * as Y from "yjs";

const ROOM = "@vals";
const DEFAULT_URL = "wss://yjs.cfapps.us10-001.hana.ondemand.com";
const KV_MAP = "kv";

export type ZonRecord = {
  id?: string;
  name: string;
  description?: string;
  createdAt?: string;
  type?: string;
  author?: { username?: string };
};

export type FileRecord = {
  key: string;
  name: string;
  path: string;
  type: string;
  lastModified?: string;
  version?: string;
};

type Connection = {
  doc: Y.Doc;
  provider: HocuspocusProvider;
  ready: Promise<void>;
};

const SEED_FILES = [
  {
    name: "zons.tsx",
    type: "http",
    content: `export default function Registry() {
  return <main>Rendered from the shared @vals Yjs document.</main>
}`,
  },
  {
    name: "sync.ts",
    type: "cron",
    content: `export default async function sync() {
  // Metadata and file bodies are persisted as Yjs shared types.
  return { room: "@vals", source: "yjs" }
}`,
  },
  {
    name: "README.md",
    type: "readme",
    content: `# Registry\n\nReact Router renders the full document. htmx swaps only the active route fragment. Yjs is the single data source.`,
  },
] as const;

function seedEmptyDocument(doc: Y.Doc) {
  const kv = doc.getMap(KV_MAP);
  if (Array.isArray(kv.get("zons:list"))) return;

  doc.transact(() => {
    kv.set("zons:list", [{
      id: "registry",
      name: "registry",
      description: "React Router + htmx + Yjs rendering experiment",
      type: "http",
      author: { username: "zon-cx" },
    }]);
    kv.set("val:registry", { files: SEED_FILES.map((file) => `registry:${file.name}`) });

    for (const file of SEED_FILES) {
      const key = `registry:${file.name}`;
      kv.set(`file:${key}`, {
        key,
        name: file.name,
        path: file.name,
        type: file.type,
        version: "yjs-seed",
      });
      const text = doc.getText(key);
      if (text.length === 0) text.insert(0, file.content);
    }
  }, "registry-seed");
}

declare global {
  var __registryYjs: Connection | undefined;
}

function connect(): Connection {
  if (globalThis.__registryYjs) return globalThis.__registryYjs;

  const doc = new Y.Doc({ guid: ROOM });
  const websocketProvider = new HocuspocusProviderWebsocket({
    url: process.env.YJS_URL || DEFAULT_URL,
    WebSocketPolyfill: WebSocket,
  });
  const provider = new HocuspocusProvider({
    name: ROOM,
    document: doc,
    websocketProvider,
    awareness: null,
  });

  const ready = new Promise<void>((resolve) => {
    if (provider.isSynced) return resolve();
    const finish = () => resolve();
    provider.on("synced", finish);
    // SSR must remain responsive when the collaboration server is unavailable.
    setTimeout(finish, 2_500);
  });

  globalThis.__registryYjs = { doc, provider, ready };
  return globalThis.__registryYjs;
}

async function getDoc() {
  const connection = connect();
  await connection.ready;
  seedEmptyDocument(connection.doc);
  return connection.doc;
}

export function getYjsUrl() {
  return process.env.YJS_URL || DEFAULT_URL;
}

export async function listZons(): Promise<ZonRecord[]> {
  const doc = await getDoc();
  const value = doc.getMap(KV_MAP).get("zons:list");
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is ZonRecord => {
    return Boolean(item && typeof item === "object" && typeof (item as ZonRecord).name === "string");
  });
}

export async function listFiles(zon: string): Promise<FileRecord[]> {
  const doc = await getDoc();
  const kv = doc.getMap(KV_MAP);
  const val = kv.get(`val:${zon}`) as { files?: string[] } | undefined;
  const keys = Array.isArray(val?.files) ? val.files : [];

  return keys.flatMap((key) => {
    const record = kv.get(`file:${key}`) as Partial<FileRecord> | undefined;
    if (!record) return [];
    const fallbackName = key.slice(zon.length + 1);
    return [{
      key,
      name: record.name || fallbackName,
      path: record.path || record.name || fallbackName,
      type: record.type || "file",
      lastModified: record.lastModified,
      version: record.version,
    }];
  });
}

export async function getFile(zon: string, file: string) {
  const doc = await getDoc();
  const key = `${zon}:${file}`;
  const metadata = doc.getMap(KV_MAP).get(`file:${key}`) as Partial<FileRecord> | undefined;
  const content = doc.getText(key).toString();
  return {
    metadata: metadata ? {
      key,
      name: metadata.name || file,
      path: metadata.path || file,
      type: metadata.type || "file",
    } satisfies FileRecord : undefined,
    content,
  };
}
