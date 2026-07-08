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

// `deno serve` expects a default export with a `fetch` method (the Hono app
// instance provides this). The individual files export `app.fetch` directly
// because Val Town deploys each one separately.
export default app;
