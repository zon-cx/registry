/** @jsxImportSource npm:hono@latest/jsx */

// Local development entry point.
//
// In production each of these files is deployed as its own Val Town HTTP val
// (zons.val.run, zon.val.run, svc.val.run, ...) via its own `export default`,
// which wraps its routes in the shared renderer (renderer.tsx). This combined
// server composes the SAME route handlers under a single origin using ONE
// renderer, so the whole flow can be previewed locally with a single HTML shell
// and a single shared Yjs connection:
//
//   /            -> zons  (gallery of all zons)
//   /zon/*       -> zon   (file listing for a zon)
//   /file.http/* -> file.http  (HTTP file editor)
//   /file.cron/* -> file.cron  (cron file editor)
//   /file.readme/* -> file.readme (readme editor)
//   /file/*      -> file  (generic file editor)

import { createApp } from "./renderer.tsx";

import { handler as zons } from "./zons.tsx";
import { handler as zon } from "./zon.tsx";
import { handler as fileHttp } from "./file.http.tsx";
import { handler as fileCron } from "./file.cron.tsx";
import { handler as fileReadme } from "./file.readme.tsx";
import { handler as file } from "./file.tsx";

// One app, one renderer. `app.route(...)` composes each feature's routes onto
// this instance so they all inherit the single shared shell (unlike `mount`,
// which would run each sub-app's own pipeline and duplicate the document).
const app = createApp();

// Mount specialized sub-apps first so their prefixes match before the
// catch-all gallery composed at "/".
app.route("/zon", zon);
app.route("/file.http", fileHttp);
app.route("/file.cron", fileCron);
app.route("/file.readme", fileReadme);
app.route("/file", file);
app.route("/", zons);

// Unwrap Hono errors to see original error details in local dev.
app.onError((err, _c) => {
  console.error(err);
  throw err;
});

// Run with `deno run -A main.tsx`. We call Deno.serve directly because the
// individual val files export `app.fetch` in the Val Town style.
//
// Bind to DEV_PORT so the v0 preview (which watches that port) picks the app
// up; fall back to PORT, then 8000 for plain local runs.
const port = Number(
  Deno.env.get("DEV_PORT") ?? Deno.env.get("PORT") ?? 8000,
);
Deno.serve({ port, hostname: "0.0.0.0" }, app.fetch);

export default app;
