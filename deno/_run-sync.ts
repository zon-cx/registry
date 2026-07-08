import { openKv } from "https://esm.town/v/pomdtr/kv";
import { sync } from "./sync.ts";

const kv = openKv();

const before = await kv.get("zons:list").catch(() => null);
console.log("[v0] zons:list before:", Array.isArray(before) ? before.length : before);

if (!before || (Array.isArray(before) && before.length === 0)) {
  console.log("[v0] running sync()...");
  await sync();
  const after = await kv.get("zons:list").catch(() => null);
  console.log("[v0] zons:list after:", Array.isArray(after) ? after.length : after);
} else {
  console.log("[v0] KV already populated, skipping sync");
}
