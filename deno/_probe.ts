import { callerRef } from "https://esm.town/v/pomdtr/refs";
import { openKv } from "https://esm.town/v/pomdtr/kv";

try {
  console.log("[v0] callerRef:", JSON.stringify(callerRef()));
} catch (e) {
  console.log("[v0] callerRef threw:", (e as Error).message);
}

const kv = openKv();
await kv.set("probe:arr", [{ a: 1 }, { a: 2 }]);
const back = await kv.get("probe:arr");
console.log("[v0] roundtrip:", JSON.stringify(back));

const zons = await kv.get("zons:list").catch((e) => "ERR:" + (e as Error).message);
console.log("[v0] zons:list:", Array.isArray(zons) ? `array(${zons.length})` : JSON.stringify(zons));
