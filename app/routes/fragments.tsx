import { Braces, Clock3, Code2, File, FileText, FolderKanban, Globe2, Mail, Radio } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { getFile, getYjsUrl, listFiles, listZons } from "~/lib/yjs.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const zon = params.zon;
  const file = params["*"];
  const canonical = zon ? `/${encodeURIComponent(zon)}${file ? `/${file.split("/").map(encodeURIComponent).join("/")}` : ""}` : "/";

  if (request.headers.get("HX-Request") !== "true") return redirect(canonical);

  let markup = "";
  if (!zon) {
    const zons = await listZons();
    markup = renderToStaticMarkup(
      <section className="view" aria-labelledby="zons-title">
        <header className="view-header">
          <div><p className="eyebrow">Yjs registry</p><h1 id="zons-title">Collaborative zons</h1><p className="lede">Every card is rendered from the shared <code>@vals</code> document.</p></div>
          <div className="count-pill">{zons.length} zons</div>
        </header>
        {zons.length === 0 ? (
          <div className="empty-state"><div className="empty-icon"><Radio aria-hidden="true" /></div><h2>Waiting for Yjs data</h2><p>The registry will appear when the @vals document has synchronized.</p></div>
        ) : (
          <div className="card-grid">
            {zons.map((item) => {
              const encodedZon = encodeURIComponent(item.name);
              const href = `/${encodedZon}`;
              return (
                <a key={item.name} href={href} className="registry-card" {...{ "hx-get": `/_fragments/${encodedZon}`, "hx-target": "#route-content", "hx-swap": "innerHTML show:#route-content:top", "hx-push-url": href }}>
                  <div className="card-icon"><Globe2 aria-hidden="true" /></div>
                  <div className="card-copy"><h2>{item.name}</h2><p>{item.description || "A collaborative Val Town workspace."}</p></div>
                  <div className="card-meta"><span>{item.author?.username || "workspace"}</span><span>{item.type || "val"}</span></div>
                </a>
              );
            })}
          </div>
        )}
      </section>,
    );
  } else if (!file) {
    const files = await listFiles(zon);
    const encodedZon = encodeURIComponent(zon);
    markup = renderToStaticMarkup(
      <section className="view" aria-labelledby="files-title">
        <nav className="breadcrumbs" aria-label="Breadcrumb"><a href="/" {...{ "hx-get": "/_fragments", "hx-target": "#route-content", "hx-swap": "innerHTML show:#route-content:top", "hx-push-url": "/" }}>Registry</a><span aria-hidden="true">/</span><span>{zon}</span></nav>
        <header className="view-header">
          <div><p className="eyebrow">Yjs workspace</p><h1 id="files-title"><FolderKanban aria-hidden="true" /> {zon}</h1><p className="lede">Choose a synchronized file to open its collaborative editor.</p></div>
          <div className="count-pill">{files.length} files</div>
        </header>
        {files.length === 0 ? (
          <div className="empty-state"><div className="empty-icon"><Radio aria-hidden="true" /></div><h2>No synchronized files</h2><p>The Yjs document has no file metadata for {zon} yet.</p></div>
        ) : (
          <div className="card-grid file-grid">
            {files.map((item) => {
              const filePath = item.path || item.name;
              const encodedPath = filePath.split("/").map(encodeURIComponent).join("/");
              const href = `/${encodedZon}/${encodedPath}`;
              return (
                <a key={item.key} href={href} className="registry-card file-card" {...{ "hx-get": `/_fragments/${encodedZon}/${encodedPath}`, "hx-target": "#route-content", "hx-swap": "innerHTML show:#route-content:top", "hx-push-url": href }}>
                  <div className="card-icon">{item.type === "http" ? <Code2 aria-hidden="true" /> : item.type === "email" ? <Mail aria-hidden="true" /> : item.type === "interval" || item.type === "cron" ? <Clock3 aria-hidden="true" /> : item.type === "readme" ? <FileText aria-hidden="true" /> : item.type === "script" ? <Braces aria-hidden="true" /> : <File aria-hidden="true" />}</div>
                  <div className="card-copy"><h2>{item.name || filePath}</h2><p>{filePath}</p></div>
                  <div className="card-meta"><span>{item.type || "file"}</span><span>Y.Text</span></div>
                </a>
              );
            })}
          </div>
        )}
      </section>,
    );
  } else {
    const record = await getFile(zon, file);
    const encodedZon = encodeURIComponent(zon);
    markup = renderToStaticMarkup(
      <section className="view editor-view" aria-labelledby="editor-title">
        <nav className="breadcrumbs" aria-label="Breadcrumb"><a href="/" {...{ "hx-get": "/_fragments", "hx-target": "#route-content", "hx-swap": "innerHTML show:#route-content:top", "hx-push-url": "/" }}>Registry</a><span aria-hidden="true">/</span><a href={`/${encodedZon}`} {...{ "hx-get": `/_fragments/${encodedZon}`, "hx-target": "#route-content", "hx-swap": "innerHTML show:#route-content:top", "hx-push-url": `/${encodedZon}` }}>{zon}</a><span aria-hidden="true">/</span><span>{file}</span></nav>
        <header className="editor-header"><div><p className="eyebrow">Live Y.Text</p><h1 id="editor-title"><Code2 aria-hidden="true" /> {file}</h1></div><span className="live-pill"><span /> connected room: @vals</span></header>
        <div className="editor-frame"><ts-editor id="editor" component={`${zon}:${file}`} room="@vals" url={getYjsUrl()} value={record.content} /></div>
      </section>,
    );
  }

  return new Response(markup, { headers: { "Content-Type": "text/html; charset=utf-8", "Vary": "HX-Request", "Cache-Control": "no-store" } });
}
