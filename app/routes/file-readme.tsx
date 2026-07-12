import { FileText } from "lucide-react";
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
  if (record.metadata.type !== "readme") throw new Response("File is not README content", { status: 409 });

  const markup = renderToStaticMarkup(
    <aside className="type-detail" aria-label="README file details">
      <div className="type-detail-icon"><FileText aria-hidden="true" /></div>
      <div className="type-detail-copy"><p className="eyebrow">README document</p><h2>Markdown source</h2><p>Edit the shared Y.Text source below. Markdown presentation can consume this document without changing the collaborative editor.</p></div>
      <div className="type-detail-meta"><span>Markdown</span><span>README</span></div>
    </aside>,
  );

  return new Response(markup, { headers: { "Content-Type": "text/html; charset=utf-8", "Vary": "HX-Request", "Cache-Control": "no-store" } });
}
