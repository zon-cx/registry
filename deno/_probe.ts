import { openKv } from "https://esm.town/v/pomdtr/kv";

const kv = openKv();

// 1. small value, same-process roundtrip
await kv.set("zons:list", [{ name: "x" }, { name: "y" }]);
const back = await kv.get("zons:list").catch((e) => "ERR:" + e.message);
console.log("[v0] small zons:list roundtrip:", JSON.stringify(back));

// 2. read a file: key sync claims it wrote earlier (cross-process persistence)
const fk = await kv.get("file:editor:main.tsx").catch((e) => "ERR:" + e.message);
console.log("[v0] file:editor:main.tsx present?:", fk ? "YES" : "NO", typeof fk);

// 3. read val: key
const vk = await kv.get("val:editor").catch((e) => "ERR:" + e.message);
console.log("[v0] val:editor present?:", vk ? "YES" : "NO");
