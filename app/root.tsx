import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import type { LinksFunction, MetaFunction } from "react-router";
import styles from "./style.css?url";

export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }];

export const meta: MetaFunction = () => [
  { title: "Zon Registry" },
  { name: "description", content: "A collaborative registry rendered from Yjs with React Router and htmx." },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-background">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <script src="https://unpkg.com/htmx.org@2.0.8" crossOrigin="anonymous" />
        <script src="https://esm.sh/@cxai/ide@1.0.19" type="module" crossOrigin="anonymous" />
      </head>
      <body>
        <header className="shell-header">
          <a href="/" className="brand" aria-label="Zon Registry home">
            <span className="brand-mark" aria-hidden="true">Z</span>
            <span>Zon Registry</span>
          </a>
          <div className="source-badge"><span /> Yjs source</div>
        </header>
        <main id="route-content" tabIndex={-1}>{children}</main>
        <script dangerouslySetInnerHTML={{ __html: `
          document.addEventListener('htmx:afterSettle', function (event) {
            if (event.detail && event.detail.target && event.detail.target.id === 'route-content') {
              event.detail.target.focus({ preventScroll: true });
            }
          });
        ` }} />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
