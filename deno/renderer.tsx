/** @jsxImportSource npm:hono/jsx */

// Shared HTML shell + app factory.
//
// Every page in the app (gallery, zon file list, and the per-type file editors)
// is served through ONE renderer so the base document — htmx, iconify, Tailwind,
// the `@cxai/ide` editor module, and the shared Yjs provider — is loaded a single
// time and then kept alive across htmx swaps.
//
// Two things are exported:
//   - `createApp()` — a Hono factory that installs the renderer middleware. Used
//     by both the combined router (main.tsx) and by each module's standalone
//     Val Town `export default` so there is exactly one renderer in either mode.
//   - `isHx(c)` — true on htmx ajax/swap requests, where we return the bare
//     fragment (no `<html>` document) so swaps stay clean.

import { Hono } from "npm:hono";
import type { Context } from "npm:hono";
import { raw } from "npm:hono/html";
import type { PropsWithChildren } from "npm:hono/jsx";
import { jsxRenderer } from "npm:hono/jsx-renderer";
import config from "./config.json" with { type: "json" };

/** htmx sends `HX-Request: true` on ajax/swap requests. */
export const isHx = (c: Context): boolean => c.req.header("HX-Request") === "true";

// Open the single shared Yjs room once, at page load. `cmCollab({ url, room })`
// populates the `@cxai/ide` `rooms` provider cache; every <ts-editor> mounted
// afterwards (including tiles swapped in by htmx) reuses that live socket and
// just binds its own Y.Text via `getText(component)` — connect once, rebind per
// component. Editors mount immediately and sync in the background.
const YJS_PRECONNECT = `
import { cmCollab } from "https://esm.sh/@cxai/ide@1.0.19/collab";
try {
  cmCollab({ url: ${JSON.stringify(config.editor.yjs.url)}, room: ${JSON.stringify(config.editor.yjs.room)} });
  console.log("[yjs] preconnected room", ${JSON.stringify(config.editor.yjs.room)});
} catch (err) {
  console.warn("[yjs] preconnect failed", err);
}
`;

// After htmx settles a swap into #tile (an editor tile), bring it into view.
// A delegated listener on the document survives swaps and needs no per-element
// attribute (JSX can't express the `hx-on:htmx:after-settle` colon syntax).
const TILE_SCROLL = `
document.addEventListener("htmx:afterSettle", (e) => {
  const t = e.target;
  if (t && t.id === "tile") {
    t.scrollIntoView({ behavior: "smooth", block: "start" });
  }
});
`;

// The document shell. On an htmx request we render just the children so the
// response is a clean fragment for swapping; the persistent <head> (and the live
// Yjs connection it holds) is never torn down.
const renderer = jsxRenderer(
  ({ children }: PropsWithChildren, c: Context) => {
    if (isHx(c)) return <>{children}</>;
    // NOTE: hono 4.7.x's jsxRenderer ignores a function-form options arg, so we
    // cannot let it compute `docType` per-request. Instead options are static
    // (`docType: false`) and we emit the DOCTYPE ourselves here — only on the
    // full-document (non-htmx) response.
    return (
      <>
        {raw("<!DOCTYPE html>")}
        <html lang="en" className="bg-gray-50">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Zon Registry</title>
          <meta name="description" content="Browse, edit, and collaborate on Zon files" />
          <script
            id="htmx"
            src="https://unpkg.com/htmx.org@2.0.3"
            hx-preserve="true"
          >
          </script>
          <script
            id="htmx-head-support"
            src="https://unpkg.com/htmx-ext-head-support@2.0.2/head-support.js"
            hx-preserve="true"
          >
          </script>
          <script
            id="iconify"
            src="https://cdn.jsdelivr.net/npm/iconify-icon@2.1.0/dist/iconify-icon.min.js"
            hx-preserve="true"
          >
          </script>
          <script
            id="tailwind"
            src="https://unpkg.com/@tailwindcss/browser@4"
            hx-preserve="true"
          >
          </script>
          <script
            id="cxai-ide"
            type="module"
            src="https://esm.sh/@cxai/ide@1.0.19"
            hx-preserve="true"
          >
          </script>
          <script
            id="yjs-preconnect"
            type="module"
            hx-preserve="true"
            dangerouslySetInnerHTML={{ __html: YJS_PRECONNECT }}
          >
          </script>
          {/* When an editor tile is swapped into #tile, scroll it into view so
              the editor is visible instead of appearing below the fold. */}
          <script
            id="tile-scroll"
            hx-preserve="true"
            dangerouslySetInnerHTML={{ __html: TILE_SCROLL }}
          >
          </script>
        </head>
        {/* hx-boost turns in-app navigation into body swaps, so the head (and the
            live Yjs provider) survives every page change. head-support merges any
            <head> from boosted full-page responses. */}
        <body
          className="bg-gray-50 min-h-screen"
          hx-boost="true"
          hx-ext="head-support"
        >
          {children}
        </body>
        </html>
      </>
    );
  },
  // Static options (hono 4.7.x ignores the function form). We never let the
  // renderer auto-prepend a DOCTYPE — the component emits it manually for the
  // full document and omits it for htmx fragments. Stream the response.
  { stream: true, docType: false },
);

/**
 * App factory. Returns a Hono instance with the shared renderer already
 * installed. The router composes feature routers onto one instance via
 * `app.route(...)` (a single renderer), and each module reuses it for its
 * standalone deploy.
 */
export function createApp(): Hono {
  const app = new Hono();
  app.use("*", renderer);
  return app;
}
