import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("_fragments", "routes/fragments.tsx", { id: "fragments-home" }),
  route("_fragments/:zon", "routes/fragments.tsx", { id: "fragments-zon" }),
  route("_fragments/:zon/*", "routes/fragments.tsx", { id: "fragments-file" }),
  route("tiles/zons/:zon", "routes/zon-tile.tsx"),
  route("tiles/files/:zon/*", "routes/file-tile.tsx"),
  route(":zon", "routes/zon.tsx"),
  route(":zon/*", "routes/file.tsx"),
] satisfies RouteConfig;
