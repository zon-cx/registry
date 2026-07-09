// Node ESM resolve hook.
//
// The `deno/` sources use Deno-style import specifiers — `npm:hono`,
// `npm:hono/jsx-renderer`, and `https://esm.sh/<pkg>@<ver>?<query>`. Node has no
// idea what those are. This hook rewrites them to bare npm specifiers so the
// SAME files run unmodified under Node (via `deno/node.ts` + tsx), while Deno
// keeps resolving the originals natively.
//
//   npm:hono                         -> hono
//   npm:hono@latest/jsx              -> hono/jsx
//   https://esm.sh/yjs@13.6.23?...   -> yjs
//   https://esm.sh/@scope/pkg@1/sub  -> @scope/pkg/sub

/** Drop the version tag from a package specifier, keeping the subpath. */
function stripVersion(spec) {
  // Remove any query string / hash first (esm.sh uses `?target=...`).
  let s = spec.split("?")[0].split("#")[0];
  if (s.startsWith("@")) {
    // Scoped: @scope/name@version/subpath -> @scope/name/subpath
    const parts = s.split("/");
    if (parts.length >= 2) parts[1] = parts[1].replace(/@[^/]+$/, "");
    return parts.join("/");
  }
  // Unscoped: name@version/subpath -> name/subpath
  const parts = s.split("/");
  parts[0] = parts[0].replace(/@[^/]+$/, "");
  return parts.join("/");
}

/** Turn a `npm:` or `esm.sh` specifier into a bare npm specifier. */
function toBareNpm(specifier) {
  if (specifier.startsWith("npm:")) return stripVersion(specifier.slice(4));
  const esm = specifier.match(/^https?:\/\/esm\.sh\/(.+)$/);
  if (esm) return stripVersion(esm[1]);
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  const bare = toBareNpm(specifier);
  if (bare) return nextResolve(bare, context);
  return nextResolve(specifier, context);
}
