import { openKv } from "./store.ts";

const mode = Deno.args[0]; // "write" | "read"
const kv = openKv();
const stamp = Deno.args[1] ?? "";

if (mode === "write") {
  await kv.set("probe:hello", { msg: "yjs-store-works", stamp });
  await kv.set("content:demo:file.http", "export default 'hi " + stamp + "'");
  await kv.flush();
  console.log("[v0] wrote probe with stamp", stamp);
} else {
  const v = await kv.get("probe:hello");
  const c = await kv.get("content:demo:file.http");
  console.log("[v0] read probe:hello =", JSON.stringify(v));
  console.log("[v0] read content:demo:file.http =", JSON.stringify(c));
}
Deno.exit(0);
