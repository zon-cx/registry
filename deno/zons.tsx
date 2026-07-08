/** @jsxImportSource https://esm.sh/hono@latest/jsx */
import { jsxRenderer } from "https://esm.sh/hono/jsx-renderer";
import { openKv } from "https://esm.town/v/pomdtr/kv";
import { Hono } from "npm:hono";
import { PropsWithChildren } from "npm:hono/jsx";
import config from "./config.json" with { type: "json" };

const app = new Hono();

app.use(
  "/*",
  jsxRenderer(({ children }: PropsWithChildren) => {
    return (
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Zon Gallery</title>
          <meta name="description" content="Welcome to Zon" />
          <script hx-preserve="true" src="https://unpkg.com/@tailwindcss/browser@4"></script>
          <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
        </head>
        <body className="bg-gray-50 min-h-screen">
          {children}
          <script dangerouslySetInnerHTML={{ __html: `lucide.createIcons();` }} />
        </body>
      </html>
    );
  }),
);

app.get("/", async (c: any) => {
  const kv = openKv();
  const zons = await kv.get("zons:list") || [];

  console.log(`Found ${zons.length} zons from KV`);

  return c.render(
    <main className="container mx-auto px-4 py-8">
      <section className="mb-10 rounded-xl overflow-hidden shadow-lg relative">
        <img
          src="https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=1200&q=80"
          alt="Zon Hero"
          className="w-full h-64 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent flex flex-col justify-end p-8">
          <div className="flex items-center mb-2">
            <i
              data-lucide="folder-kanban"
              className="w-10 h-10 text-blue-400 mr-3 bg-white/10 rounded-full p-2 border border-white/20"
            >
            </i>
            <h1 className="text-4xl font-bold text-white drop-shadow">Zon Gallery</h1>
          </div>
          <p className="text-lg text-gray-200 max-w-2xl">
            Discover and explore Zons from ValTown. Beautiful, open, and collaborative code snippets for everyone.
          </p>
        </div>
      </section>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {zons.map((zon: any) => (
          <a
            key={zon.name}
            href={`${config.urls.zon}/${zon.name}`}
            className="block bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-200 overflow-hidden border border-gray-100 group"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <i data-lucide="globe" className="h-5 w-5 text-gray-500"></i>
                  <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                    {zon.name}
                  </h3>
                </div>
              </div>
              <div className="text-sm text-gray-500 mb-4 line-clamp-2">
                {zon.description && (
                  <pre className="font-mono text-xs bg-gray-50 p-2 rounded overflow-x-auto max-h-16">{zon.description.slice(0, 100)}...</pre>
                )}
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <i data-lucide="star" className="h-4 w-4 mr-1"></i>
                    <span>{zon.likeCount || 0}</span>
                  </div>
                  <div className="flex items-center">
                    <i data-lucide="git-fork" className="h-4 w-4 mr-1"></i>
                    <span>{zon.referenceCount || 0}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <i data-lucide="user" className="h-4 w-4 mr-1"></i>
                    <span>{zon.author?.username || ""}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end text-xs">
                  <div>Created: {zon.createdAt ? new Date(zon.createdAt).toLocaleDateString() : ""}</div>
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </main>,
  );
});

export default app.fetch;