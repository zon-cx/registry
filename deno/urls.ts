import config from "./config.json" with { type: "json" };

/**
 * Base URLs for the three deployed services.
 *
 * In production each val is deployed separately (zons.val.run, zon.val.run,
 * svc.val.run) and these absolute URLs from config.json are used to link
 * between them.
 *
 * For local development the combined server (main.tsx) mounts every sub-app
 * under a single origin, so linking to absolute *.val.run URLs would leave the
 * app (and gets blocked inside the v0 preview iframe). Setting the URL_* env
 * vars to relative paths keeps every link on the local origin:
 *
 *   URL_ZONS="/"  URL_ZON="/zon"  URL_FILES="/file"
 */
function env(key: string): string | undefined {
  try {
    return typeof Deno !== "undefined" ? Deno.env.get(key) : undefined;
  } catch {
    // Env access not permitted; fall back to config defaults.
    return undefined;
  }
}

export const urls = {
  zons: env("URL_ZONS") ?? config.urls.zons,
  zon: env("URL_ZON") ?? config.urls.zon,
  files: env("URL_FILES") ?? config.urls.files,
};
