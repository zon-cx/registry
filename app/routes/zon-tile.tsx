import { Globe2 } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { listZons } from "~/lib/yjs.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const zon = params.zon;
  if (!zon) throw new Response("Missing zon", { status: 400 });

  const encodedZon = encodeURIComponent(zon);
  const canonical = `/${encodedZon}`;
  if (request.headers.get("HX-Request") !== "true") return redirect(canonical);

  const record = (await listZons()).find((item) => item.name === zon);
  if (!record) throw new Response("Zon not found", { status: 404 });

  const markup = renderToStaticMarkup(
    <a href={canonical} className="registry-card" {...{ "hx-get": `/_fragments/${encodedZon}`, "hx-target": "#route-content", "hx-swap": "innerHTML show:#route-content:top", "hx-push-url": canonical }}>
      <div className="card-icon"><Globe2 aria-hidden="true" /></div>
      <div className="card-copy"><h2>{record.name}</h2><p>{record.description || "A collaborative Val Town workspace."}</p></div>
      <div className="card-meta"><span>{record.author?.username || "workspace"}</span><span>{record.type || "val"}</span></div>
    </a>,
  );

  return new Response(markup, { headers: { "Content-Type": "text/html; charset=utf-8", "Vary": "HX-Request", "Cache-Control": "no-store" } });
}
