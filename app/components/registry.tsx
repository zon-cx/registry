import {
  Braces,
  Clock3,
  Code2,
  File,
  FileText,
  FolderKanban,
  Globe2,
  Mail,
  Radio,
} from "lucide-react";
import type { FileRecord, ZonRecord } from "~/lib/yjs.server";

const hx = (fragment: string, canonical: string) => ({
  "hx-get": fragment,
  "hx-target": "#route-content",
  "hx-swap": "innerHTML show:#route-content:top",
  "hx-push-url": canonical,
});

export function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><Radio aria-hidden="true" /></div>
      <h2>{title}</h2>
      <p>{detail}</p>
    </div>
  );
}

export function ZonsView({ zons }: { zons: ZonRecord[] }) {
  return (
    <section className="view" aria-labelledby="zons-title">
      <header className="view-header">
        <div>
          <p className="eyebrow">Yjs registry</p>
          <h1 id="zons-title">Collaborative zons</h1>
          <p className="lede">Every card is rendered from the shared <code>@vals</code> document.</p>
        </div>
        <div className="count-pill">{zons.length} zons</div>
      </header>
      {zons.length === 0 ? (
        <EmptyState title="Waiting for Yjs data" detail="The registry will appear when the @vals document has synchronized." />
      ) : (
        <div className="card-grid">
          {zons.map((zon) => {
            const href = `/${encodeURIComponent(zon.name)}`;
            return (
              <a key={zon.name} href={href} className="registry-card" {...hx(`/_fragments/${encodeURIComponent(zon.name)}`, href)}>
                <div className="card-icon"><Globe2 aria-hidden="true" /></div>
                <div className="card-copy">
                  <h2>{zon.name}</h2>
                  <p>{zon.description || "A collaborative Val Town workspace."}</p>
                </div>
                <div className="card-meta">
                  <span>{zon.author?.username || "workspace"}</span>
                  <span>{zon.type || "val"}</span>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </section>
  );
}

const fileIcon = (type: string) => {
  if (type === "http") return <Code2 aria-hidden="true" />;
  if (type === "email") return <Mail aria-hidden="true" />;
  if (type === "interval" || type === "cron") return <Clock3 aria-hidden="true" />;
  if (type === "readme") return <FileText aria-hidden="true" />;
  if (type === "script") return <Braces aria-hidden="true" />;
  return <File aria-hidden="true" />;
};

export function ZonView({ zon, files }: { zon: string; files: FileRecord[] }) {
  const encodedZon = encodeURIComponent(zon);
  return (
    <section className="view" aria-labelledby="files-title">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <a href="/" {...hx("/_fragments", "/")}>Registry</a>
        <span aria-hidden="true">/</span>
        <span>{zon}</span>
      </nav>
      <header className="view-header">
        <div>
          <p className="eyebrow">Yjs workspace</p>
          <h1 id="files-title"><FolderKanban aria-hidden="true" /> {zon}</h1>
          <p className="lede">Choose a file to mount its collaborative editor inline.</p>
        </div>
        <div className="count-pill">{files.length} files</div>
      </header>
      {files.length === 0 ? (
        <EmptyState title="No synchronized files" detail={`The Yjs document has no file metadata for ${zon} yet.`} />
      ) : (
        <div className="card-grid file-grid">
          {files.map((file) => {
            const filePath = file.path || file.name;
            const encodedPath = filePath.split("/").map(encodeURIComponent).join("/");
            const href = `/${encodedZon}/${encodedPath}`;
            return (
              <a key={file.key} href={href} className="registry-card file-card" {...hx(`/_fragments/${encodedZon}/${encodedPath}`, href)}>
                <div className="card-icon">{fileIcon(file.type)}</div>
                <div className="card-copy">
                  <h2>{file.name || filePath}</h2>
                  <p>{filePath}</p>
                </div>
                <div className="card-meta"><span>{file.type || "file"}</span><span>Y.Text</span></div>
              </a>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function FileView({ zon, file, content, yjsUrl }: { zon: string; file: string; content: string; yjsUrl: string }) {
  const encodedZon = encodeURIComponent(zon);
  const component = `${zon}:${file}`;
  return (
    <section className="view editor-view" aria-labelledby="editor-title">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <a href="/" {...hx("/_fragments", "/")}>Registry</a>
        <span aria-hidden="true">/</span>
        <a href={`/${encodedZon}`} {...hx(`/_fragments/${encodedZon}`, `/${encodedZon}`)}>{zon}</a>
        <span aria-hidden="true">/</span>
        <span>{file}</span>
      </nav>
      <header className="editor-header">
        <div>
          <p className="eyebrow">Live Y.Text</p>
          <h1 id="editor-title"><Code2 aria-hidden="true" /> {file}</h1>
        </div>
        <span className="live-pill"><span /> connected room: @vals</span>
      </header>
      <div className="editor-frame">
        <ts-editor
          id="editor"
          component={component}
          room="@vals"
          url={yjsUrl}
          value={content}
        />
      </div>
    </section>
  );
}
