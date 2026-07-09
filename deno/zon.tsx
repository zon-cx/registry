/** @jsxImportSource npm:hono@latest/jsx */

import { openKv } from "./store.ts";
import { Hono } from "npm:hono";
import config from "./config.json" with { type: "json" };
import { urls } from "./urls.ts";
import { createApp } from "./renderer.tsx";

// Routes only — the shell/renderer (and hx-boost navigation) is applied once by
// main.tsx (combined) or by the standalone `export default` below.
const handler = new Hono();

// File type definitions from config
type TypeInfo = {
  icon: string;
  color: string;
  name: string;
};

const FILE_TYPE_CONFIG = config.fileTypes as Record<string, TypeInfo>;

type File = {
  name: string;
  type: string;
  description: string;
  path: string;
  likeCount: number;
  referenceCount: number;
  fileName: string;
};

// Normalize a file to its config type key (e.g. an extension-less "file" entry
// resolves to its extension).
function resolveType(file: File): string {
  const fileName = file.name || file.path || file.fileName;
  const extension = fileName?.split(".").pop()?.toLowerCase();
  return file.type === "file" ? extension ?? "default" : file.type ?? "default";
}

function getFileTypeInfo(file: File): TypeInfo {
  const type = resolveType(file);
  return FILE_TYPE_CONFIG[type] || FILE_TYPE_CONFIG.default;
}

// Pick the editor route for a file type. In the combined app each editor is
// mounted as a sibling path (/file, /file.http, ...), so we can deep-link and
// htmx-swap the matching tile. In production each editor is its own val, so we
// fall back to the shared files URL.
function editorBase(file: File): string {
  if (!urls.files.startsWith("/")) return urls.files;
  const type = resolveType(file);
  if (type === "http" || type === "script") return "/file.http";
  if (type === "interval" || type === "cron") return "/file.cron";
  if (type === "md") return "/file.readme";
  return "/file";
}

handler.get("/:zon/files", async (c) => {
  const { files } = await getZon(c.req.param("zon"));
  return c.json({
    files: files,
    zon: c.req.param("zon"),
  });
});

async function getZon(zon: string) {
  const kv = openKv();

  try {
    // Get val metadata from KV
    const valData = await kv.get(`val:${zon}`);

    if (!valData) {
      return {
        files: [],
        name: zon,
        id: "",
      };
    }

    // Get files for this val from KV
    const files = [];
    const fileKeys = valData.files || [];

    for (const fileKey of fileKeys) {
      const fileData = await kv.get(`file:${fileKey}`);
      if (fileData) {
        files.push({
          ...fileData,
          likeCount: 0,
          referenceCount: 0,
        });
      }
    }

    return {
      files,
      name: zon,
      id: valData.id,
    };
  } catch (error) {
    console.error("Error getting zon data:", error);
    return {
      files: [],
      name: zon,
      id: "",
    };
  }
}

handler.get("/", async (c: any) => {
  return c.redirect(`/${config.main.zon}`);
});

handler.get("/:zon", async (c) => {
  // Get zon data from KV
  const zon = c.req.param("zon");
  const { files } = await getZon(zon);

  function withTypeInfo(file: File) {
    const fileName = file.name || file.path || file.fileName;
    return { ...file, typeInfo: getFileTypeInfo(file), base: editorBase(file), name: fileName };
  }

  return c.render(
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <a href={urls.zons} className="text-blue-600 hover:text-blue-800">
            <iconify-icon icon="lucide:arrow-left" className="h-5 w-5"></iconify-icon>
          </a>
          <h1 className="text-3xl font-bold text-gray-900">{zon}</h1>
        </div>
      </div>
      <section className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {files.map(withTypeInfo).map(({ typeInfo, base, ...file }) => (
            <a
              key={file.name}
              href={`${base}/${zon}/${file.name}`}
              hx-get={`${base}/${zon}/${file.name}`}
              hx-target="#tile"
              hx-swap="innerHTML"
              hx-push-url="true"
              className="block bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-200 overflow-hidden border border-gray-100 group cursor-pointer"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <iconify-icon
                      icon={`lucide:${typeInfo?.icon}`}
                      className={`h-5 w-5 text-${typeInfo.color}-500`}
                    >
                    </iconify-icon>
                    <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                      {file.name}
                    </h3>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium bg-${typeInfo.color}-100 text-${typeInfo.color}-800 rounded-full`}
                  >
                    {typeInfo.name}
                  </span>
                </div>

                {file.description && (
                  <div className="text-sm text-gray-500 mb-4 line-clamp-2">
                    <pre className="font-mono text-xs bg-gray-50 p-2 rounded overflow-x-auto max-h-16">
                        {file.description.slice(0, 100)}...
                    </pre>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <iconify-icon icon="lucide:edit" className="h-4 w-4 mr-1"></iconify-icon>
                      <span>Edit</span>
                    </div>
                    {file.type === "http" && (
                      <div className="flex items-center">
                        <iconify-icon icon="lucide:external-link" className="h-4 w-4 mr-1"></iconify-icon>
                        <span>Run</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end text-xs">
                    <div>
                      Modified: {file.lastModified ? new Date(file.lastModified).toLocaleDateString() : "Unknown"}
                    </div>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {files.length === 0 && (
        <div className="text-center py-12">
          <iconify-icon icon="lucide:folder-open" className="h-16 w-16 text-gray-400 mx-auto mb-4"></iconify-icon>
          <h3 className="text-xl font-medium text-gray-900 mb-2">No files found</h3>
          <p className="text-gray-600">This zon doesn't contain any files yet.</p>
        </div>
      )}

      {/* Tile region: file editors are swapped in here by htmx (hx-target="#tile")
          without a full page reload, so the shared Yjs connection stays alive. A
          direct visit to a file URL loads the standalone editor page instead. */}
      {files.length > 0 && (
        <section id="tile" className="mt-4">
          <div className="text-center py-16 bg-white rounded-lg border border-dashed border-gray-300">
            <iconify-icon icon="lucide:mouse-pointer-click" className="h-10 w-10 text-gray-400"></iconify-icon>
            <p className="text-gray-600 mt-3">Select a file above to open its editor here.</p>
          </div>
        </section>
      )}
    </main>,
  );
});

// Routes for the combined router (main.tsx) to compose.
export { handler };

// Standalone Val Town deploy: wrap the routes in the shared renderer.
export default createApp().route("/", handler).fetch;
