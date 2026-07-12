import { Clock3, Code2 } from "lucide-react";
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
  if (record.metadata.type !== "cron" && record.metadata.type !== "interval") throw new Response("File is not a scheduled function", { status: 409 });

  const markup = renderToStaticMarkup(
    <aside className="type-detail" aria-label="Scheduled file details">
      <div className="type-detail-icon"><Clock3 aria-hidden="true" /></div>
      <div className="type-detail-copy"><p className="eyebrow">Scheduled function</p><h2>{record.metadata.type === "interval" ? "Interval trigger" : "Cron trigger"}</h2><p>This source runs on a schedule managed by its runtime. The collaborative editor stays shared with every other file type.</p></div>
      <div className="type-detail-meta"><span><Code2 aria-hidden="true" /> TypeScript</span><span>{record.metadata.type}</span></div>
    </aside>,
  );

  return new Response(markup, { headers: { "Content-Type": "text/html; charset=utf-8", "Vary": "HX-Request", "Cache-Control": "no-store" } });
}
