import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("_fragments", "routes/fragments.tsx", { id: "fragments-home" }),
  route("_fragments/:zon", "routes/fragments.tsx", { id: "fragments-zon" }),
  route("_fragments/:zon/*", "routes/fragments.tsx", { id: "fragments-file" }),
  route("_fragments/files/http/:zon/*", "routes/file-http.tsx"),
  route("_fragments/files/cron/:zon/*", "routes/file-cron.tsx"),
  route("_fragments/files/readme/:zon/*", "routes/file-readme.tsx"),
  route("tiles/zons/:zon", "routes/zon-tile.tsx"),
  route("tiles/files/:zon/*", "routes/file-tile.tsx"),
  route(":zon", "routes/zon.tsx"),
  route(":zon/*", "routes/file.tsx"),
] satisfies RouteConfig;
