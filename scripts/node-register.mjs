// Registers the Deno-specifier resolve hook (node-loader.mjs) for the whole
// process. Passed via `node --import ./scripts/node-register.mjs` BEFORE the
// app is imported so every `npm:` / `esm.sh` specifier is rewritten on the way
// in. tsx is registered first (via its own `--import tsx`) so this hook runs
// ahead of it and hands plain bare specifiers down the chain.
import { register } from "node:module";

register("./node-loader.mjs", import.meta.url);
