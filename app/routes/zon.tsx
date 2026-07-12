import { Braces, Clock3, Code2, File, FileText, FolderKanban, Mail, Radio } from "lucide-react";
import { useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { listFiles } from "~/lib/yjs.server";

export async function loader({ params }: LoaderFunctionArgs) {
  const zon = params.zon;
  if (!zon) throw new Response("Missing zon", { status: 400 });
  return { zon, files: await listFiles(zon) };
}

export default function ZonRoute() {
  const { zon, files } = useLoaderData<typeof loader>();
  const encodedZon = encodeURIComponent(zon);

  return (
    <section className="view" aria-labelledby="files-title">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <a href="/" {...{ "hx-get": "/_fragments", "hx-target": "#route-content", "hx-swap": "innerHTML show:#route-content:top", "hx-push-url": "/" }}>Registry</a>
        <span aria-hidden="true">/</span>
        <span>{zon}</span>
      </nav>
      <header className="view-header">
        <div>
          <p className="eyebrow">Yjs workspace</p>
          <h1 id="files-title"><FolderKanban aria-hidden="true" /> {zon}</h1>
          <p className="lede">Choose a synchronized file to open its collaborative editor.</p>
        </div>
        <div className="count-pill">{files.length} files</div>
      </header>
      {files.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Radio aria-hidden="true" /></div>
          <h2>No synchronized files</h2>
          <p>The Yjs document has no file metadata for {zon} yet.</p>
        </div>
      ) : (
        <div className="card-grid file-grid">
          {files.map((file) => {
            const filePath = file.path || file.name;
            const encodedPath = filePath.split("/").map(encodeURIComponent).join("/");
            const href = `/${encodedZon}/${encodedPath}`;
            return (
              <a
                key={file.key}
                href={href}
                className="registry-card file-card"
                {...{
                  "hx-get": `/_fragments/${encodedZon}/${encodedPath}`,
                  "hx-target": "#route-content",
                  "hx-swap": "innerHTML show:#route-content:top",
                  "hx-push-url": href,
                }}
              >
                <div className="card-icon">
                  {file.type === "http" ? <Code2 aria-hidden="true" /> : file.type === "email" ? <Mail aria-hidden="true" /> : file.type === "interval" || file.type === "cron" ? <Clock3 aria-hidden="true" /> : file.type === "readme" ? <FileText aria-hidden="true" /> : file.type === "script" ? <Braces aria-hidden="true" /> : <File aria-hidden="true" />}
                </div>
                <div className="card-copy"><h2>{file.name || filePath}</h2><p>{filePath}</p></div>
                <div className="card-meta"><span>{file.type || "file"}</span><span>Y.Text</span></div>
              </a>
            );
          })}
        </div>
      )}
    </section>
  );
}
