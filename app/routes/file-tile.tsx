import { Braces, Clock3, Code2, File, FileText, Mail } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { getFile } from "~/lib/yjs.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const zon = params.zon;
  const file = params["*"];
  if (!zon || !file) throw new Response("Missing file", { status: 400 });

  const encodedZon = encodeURIComponent(zon);
  const encodedPath = file.split("/").map(encodeURIComponent).join("/");
  const canonical = `/${encodedZon}/${encodedPath}`;
  if (request.headers.get("HX-Request") !== "true") return redirect(canonical);

  const record = await getFile(zon, file);
  if (!record.metadata) throw new Response("File not found", { status: 404 });

  const markup = renderToStaticMarkup(
    <a href={canonical} className="registry-card file-card" {...{ "hx-get": `/_fragments/${encodedZon}/${encodedPath}`, "hx-target": "#route-content", "hx-swap": "innerHTML show:#route-content:top", "hx-push-url": canonical }}>
      <div className="card-icon">{record.metadata.type === "http" ? <Code2 aria-hidden="true" /> : record.metadata.type === "email" ? <Mail aria-hidden="true" /> : record.metadata.type === "interval" || record.metadata.type === "cron" ? <Clock3 aria-hidden="true" /> : record.metadata.type === "readme" ? <FileText aria-hidden="true" /> : record.metadata.type === "script" ? <Braces aria-hidden="true" /> : <File aria-hidden="true" />}</div>
      <div className="card-copy"><h2>{record.metadata.name || file}</h2><p>{record.metadata.path || file}</p></div>
      <div className="card-meta"><span>{record.metadata.type || "file"}</span><span>Y.Text</span></div>
    </a>,
  );

  return new Response(markup, { headers: { "Content-Type": "text/html; charset=utf-8", "Vary": "HX-Request", "Cache-Control": "no-store" } });
}
