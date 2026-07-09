/** @jsxImportSource npm:hono/jsx */

// Deno entry point (Hono).
//
// This module just composes the shared combined app (app.tsx) and exports it as
// the default Hono handler. It is served the idiomatic Hono way with
// `deno serve` -- no manual `Deno.serve` call and no launcher script:
//
//   deno serve -A --port 5173 deno/main.tsx
//
// (see the "dev" script in package.json). `deno serve` binds the port and calls
// the exported app's `fetch`, so the same default export also works when this
// file is deployed as a Val Town val. For the Node equivalent see deno/node.ts
// (`npm run dev:node`).

import { createCombinedApp } from "./app.tsx";

const app = createCombinedApp();

export default app;
