// Node entry point.
//
// Serves the SAME combined app (app.tsx) as the Deno entry (main.tsx), but with
// @hono/node-server instead of Deno.serve. The Deno-style import specifiers
// (`npm:hono`, `https://esm.sh/...`) used throughout `deno/` are rewritten to
// bare npm packages by scripts/node-loader.mjs, so no source changes are needed.
//
// Run it with:
//   node --import tsx --import ./scripts/node-register.mjs deno/node.ts
// or simply: `npm run dev:node`
import { serve } from "@hono/node-server";

import { createCombinedApp } from "./app.tsx";

const app = createCombinedApp();

// Match main.tsx port precedence: DEV_PORT (v0 preview) -> PORT -> 8000.
const port = Number(process.env.DEV_PORT ?? process.env.PORT ?? 8000);

serve({ fetch: app.fetch, port, hostname: "0.0.0.0" }, (info) => {
  console.log(`[node] listening on http://0.0.0.0:${info.port}`);
});

export default app;
