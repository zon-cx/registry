import { Code2, Globe2 } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { getFile } from "~/lib/yjs.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const zon = params.zon;
  const file = params["*"];
  if (!zon || !file) throw new Response("Missing file", { status: 400 });

  const encodedPath = file.split("/").map(encodeURIComponent).join("/");
  const canonical = `/${encodeURIComponent(zon)}/${encodedPath}`;
  if (request.headers.get("HX-Request") !== "true") return redirect(canonical);

  const record = await getFile(zon, file);
  if (!record.metadata) throw new Response("File not found", { status: 404 });
  if (record.metadata.type !== "http") throw new Response("File is not an HTTP endpoint", { status: 409 });

  const markup = renderToStaticMarkup(
    <aside className="type-detail" aria-label="HTTP file details">
      <div className="type-detail-icon"><Globe2 aria-hidden="true" /></div>
      <div className="type-detail-copy"><p className="eyebrow">HTTP endpoint</p><h2>Request-driven function</h2><p>This Y.Text source is exposed as an HTTP handler. Edit the shared source below; endpoint execution remains owned by its runtime.</p></div>
      <div className="type-detail-meta"><span><Code2 aria-hidden="true" /> TypeScript</span><span>HTTP</span></div>
    </aside>,
  );

  return new Response(markup, { headers: { "Content-Type": "text/html; charset=utf-8", "Vary": "HX-Request", "Cache-Control": "no-store" } });
}
