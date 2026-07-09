/** @jsxImportSource npm:hono/jsx */

// Combined router — the single source of truth for how every feature router is
// composed onto one Hono app under one origin and one shared renderer.
//
// Both entry points import this:
//   - main.tsx  -> Deno.serve (Deno / Val Town)
//   - node.ts   -> @hono/node-server (Node, via tsx)
//
// In production each feature file is ALSO deployed as its own Val (zons.val.run,
// zon.val.run, ...) via its own `export default`. Here we compose the SAME route
// handlers so the whole flow can run as one server:
//
//   /              -> zons  (gallery of all zons)
//   /zon/*         -> zon   (file listing for a zon)
//   /file.http/*   -> file.http    (HTTP file editor)
//   /file.cron/*   -> file.cron    (cron file editor)
//   /file.readme/* -> file.readme  (readme editor)
//   /file/*        -> file  (generic file editor)

import type { Hono } from "npm:hono";
import { createApp } from "./renderer.tsx";

import { handler as zons } from "./zons.tsx";
import { handler as zon } from "./zon.tsx";
import { handler as fileHttp } from "./file.http.tsx";
import { handler as fileCron } from "./file.cron.tsx";
import { handler as fileReadme } from "./file.readme.tsx";
import { handler as file } from "./file.tsx";

/**
 * Build the combined app. One app, one renderer: `app.route(...)` composes each
 * feature's routes onto this instance so they all inherit the single shared
 * shell (unlike `mount`, which would re-run each sub-app's pipeline and
 * duplicate the document).
 */
export function createCombinedApp(): Hono {
  const app = createApp();

  // Mount specialized sub-apps first so their prefixes match before the
  // catch-all gallery composed at "/".
  app.route("/zon", zon);
  app.route("/file.http", fileHttp);
  app.route("/file.cron", fileCron);
  app.route("/file.readme", fileReadme);
  app.route("/file", file);
  app.route("/", zons);

  // Unwrap Hono errors so original error details surface in local dev.
  app.onError((err, _c) => {
    console.error(err);
    throw err;
  });

  return app;
}
