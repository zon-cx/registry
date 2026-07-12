import { Code2 } from "lucide-react";
import { useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { getFile, getYjsUrl } from "~/lib/yjs.server";

export async function loader({ params }: LoaderFunctionArgs) {
  const zon = params.zon;
  const file = params["*"];
  if (!zon || !file) throw new Response("Missing file", { status: 400 });
  const record = await getFile(zon, file);
  return { zon, file, content: record.content, yjsUrl: getYjsUrl() };
}

export default function FileRoute() {
  const { zon, file, content, yjsUrl } = useLoaderData<typeof loader>();
  const encodedZon = encodeURIComponent(zon);

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
      <div className="editor-frame">
        <ts-editor id="editor" component={`${zon}:${file}`} room="@vals" url={yjsUrl} value={content} />
      </div>
    </section>
  );
}
