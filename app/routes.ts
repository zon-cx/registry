import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("_fragments", "routes/fragments.tsx"),
  route("_fragments/:zon", "routes/fragments.tsx"),
  route("_fragments/:zon/*", "routes/fragments.tsx"),
  route(":zon", "routes/zon.tsx"),
  route(":zon/*", "routes/file.tsx"),
] satisfies RouteConfig;
