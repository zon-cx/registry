import { Code2, File } from "lucide-react";
import { useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { getFile, getYjsUrl } from "~/lib/yjs.server";

export async function loader({ params }: LoaderFunctionArgs) {
  const zon = params.zon;
  const file = params["*"];
  if (!zon || !file) throw new Response("Missing file", { status: 400 });
  const record = await getFile(zon, file);
  if (!record.metadata) throw new Response("File not found", { status: 404 });
  return { zon, file, content: record.content, type: record.metadata.type, yjsUrl: getYjsUrl() };
}

export default function FileRoute() {
  const { zon, file, content, type, yjsUrl } = useLoaderData<typeof loader>();
  const encodedZon = encodeURIComponent(zon);
  const encodedPath = file.split("/").map(encodeURIComponent).join("/");
  const detailType = type === "interval" ? "cron" : type === "http" || type === "cron" || type === "readme" ? type : null;

  return (
    <section className="view editor-view" aria-labelledby="editor-title">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <a href="/" {...{ "hx-get": "/_fragments", "hx-target": "#route-content", "hx-swap": "innerHTML show:#route-content:top", "hx-push-url": "/" }}>Registry</a>
        <span aria-hidden="true">/</span>
        <a href={`/${encodedZon}`} {...{ "hx-get": `/_fragments/${encodedZon}`, "hx-target": "#route-content", "hx-swap": "innerHTML show:#route-content:top", "hx-push-url": `/${encodedZon}` }}>{zon}</a>
        <span aria-hidden="true">/</span>
        <span>{file}</span>
      </nav>
      <header className="editor-header">
        <div><p className="eyebrow">Live Y.Text</p><h1 id="editor-title"><Code2 aria-hidden="true" /> {file}</h1></div>
        <span className="live-pill"><span /> connected room: @vals</span>
      </header>
      {detailType ? (
        <div className="type-detail-slot" {...{ "hx-get": `/_fragments/files/${detailType}/${encodedZon}/${encodedPath}`, "hx-trigger": "load", "hx-swap": "innerHTML" }}><p>Loading {detailType} details…</p></div>
      ) : (
        <aside className="type-detail" aria-label="Generic file details"><div className="type-detail-icon"><File aria-hidden="true" /></div><div className="type-detail-copy"><p className="eyebrow">Shared file</p><h2>Generic Y.Text source</h2><p>This file has no type-specific runtime details. It uses the same collaborative editor as every registry file.</p></div><div className="type-detail-meta"><span>Plain text</span><span>{type || "file"}</span></div></aside>
      )}
      <div className="editor-frame">
        <ts-editor id="editor" component={`${zon}:${file}`} room="@vals" url={yjsUrl} value={content} />
      </div>
    </section>
  );
}
