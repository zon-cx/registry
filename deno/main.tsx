/** @jsxImportSource npm:hono@latest/jsx */

// Local development entry point.
//
// In production each of these files is deployed as its own Val Town HTTP val
// (zons.val.run, zon.val.run, svc.val.run, ...). This combined server mounts
// them all under a single origin so the whole flow can be previewed locally:
//
//   /            -> zons  (gallery of all zons)
//   /zon/*       -> zon   (file listing for a zon)
//   /file.http/* -> file.http  (HTTP file editor)
//   /file.cron/* -> file.cron  (cron file editor)
//   /file.readme/* -> file.readme (readme editor)
//   /file/*      -> file  (generic file editor)

import { Hono } from "npm:hono";

import zons from "./zons.tsx";
import zon from "./zon.tsx";
import fileHttp from "./file.http.tsx";
import fileCron from "./file.cron.tsx";
import fileReadme from "./file.readme.tsx";
import file from "./file.tsx";

const app = new Hono();

// Mount specialized sub-apps first so their prefixes match before the
// catch-all gallery mounted at "/".
app.mount("/zon", zon);
app.mount("/file.http", fileHttp);
app.mount("/file.cron", fileCron);
app.mount("/file.readme", fileReadme);
app.mount("/file", file);
app.mount("/", zons);

// Run with `deno run -A main.tsx`. We call Deno.serve directly (instead of
// relying on `deno serve`'s `export default { fetch }` contract) because the
// individual val files export `app.fetch` in the Val Town style.
//
// Bind to DEV_PORT so the v0 preview (which watches that port) picks the app
// up; fall back to PORT, then 8000 for plain local runs.
const port = Number(
  Deno.env.get("DEV_PORT") ?? Deno.env.get("PORT") ?? 8000,
);
Deno.serve({ port, hostname: "0.0.0.0" }, app.fetch);

export default app;
