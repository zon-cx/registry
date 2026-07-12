import { Globe2, Radio } from "lucide-react";
import { useLoaderData } from "react-router";
import { listZons } from "~/lib/yjs.server";

export async function loader() {
  return { zons: await listZons() };
}

export default function HomeRoute() {
  const { zons } = useLoaderData<typeof loader>();

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
        <div className="empty-state">
          <div className="empty-icon"><Radio aria-hidden="true" /></div>
          <h2>Waiting for Yjs data</h2>
          <p>The registry will appear when the @vals document has synchronized.</p>
        </div>
      ) : (
        <div className="card-grid">
          {zons.map((zon) => {
            const encodedZon = encodeURIComponent(zon.name);
            const href = `/${encodedZon}`;
            return (
              <a
                key={zon.name}
                href={href}
                className="registry-card"
                {...{
                  "hx-get": `/_fragments/${encodedZon}`,
                  "hx-target": "#route-content",
                  "hx-swap": "innerHTML show:#route-content:top",
                  "hx-push-url": href,
                }}
              >
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
