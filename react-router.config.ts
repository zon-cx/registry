import type { Config } from "@react-router/dev/config";

export default {
  ssr: true,
  serverModuleFormat: "esm",
  routeDiscovery: { mode: "initial" },
} satisfies Config;
