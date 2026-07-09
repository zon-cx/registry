/** @jsxImportSource npm:hono@latest/jsx */

// Deno entry point.
//
// Composes the shared combined app (app.tsx) and serves it with Deno.serve.
// Run locally with `deno run -A deno/main.tsx` (see scripts/dev.sh). For the
// Node equivalent see deno/node.ts (`npm run dev:node`).

import { createCombinedApp } from "./app.tsx";

const app = createCombinedApp();

// Bind to DEV_PORT so the v0 preview (which watches that port) picks the app
// up; fall back to PORT, then 8000 for plain local runs.
const port = Number(
  Deno.env.get("DEV_PORT") ?? Deno.env.get("PORT") ?? 8000,
);
Deno.serve({ port, hostname: "0.0.0.0" }, app.fetch);

export default app;
