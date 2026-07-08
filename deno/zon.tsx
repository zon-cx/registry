/** @jsxImportSource npm:hono@latest/jsx */

import { readFile } from "https://esm.town/v/std/utils@85-main/index.ts";
import { openKv } from "./store.ts";
import { Hono } from "npm:hono";
import { PropsWithChildren } from "npm:hono/jsx";
import { jsxRenderer } from "npm:hono/jsx-renderer";
import config from "./config.json" with { type: "json" };

const app = new Hono();

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

function getFileTypeInfo(file: File): TypeInfo {
  const fileName = file.name || file.path || file.fileName;
  const extension = fileName?.split(".").pop()?.toLowerCase();
  const type: keyof typeof FILE_TYPE_CONFIG = file.type === "file" ? extension ?? "default" : file.type ?? "default";

  console.log({ type, fileName, extension, config: FILE_TYPE_CONFIG[type] });

  // Check by val type first
  return FILE_TYPE_CONFIG[type] || FILE_TYPE_CONFIG.default;
}

app.use(
  "/*",
  jsxRenderer(({ children }: PropsWithChildren) => {
    return (
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Zon File Gallery</title>
          <meta name="description" content="Browse and manage files in your zons" />
          <script src="https://unpkg.com/@tailwindcss/browser@4"></script>
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

app.get("/:zon/files", async (c) => {
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

app.get("/", async (c: any) => {
  return c.redirect(`/${config.main.zon}`);
});

app.get("/:zon", async (c) => {
  // Get zon data from KV
  const zon = c.req.param("zon");
  const { files } = await getZon(zon);

  function withTypeInfo(file: File) {
    const fileName = file.name || file.path || file.fileName;

    return { ...file, typeInfo: getFileTypeInfo(file), name: fileName };
  }

  return c.render(
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <a href={config.urls.zons} className="text-blue-600 hover:text-blue-800">
            <i data-lucide="arrow-left" className="h-5 w-5"></i>
          </a>
          <h1 className="text-3xl font-bold text-gray-900">{zon}</h1>
        </div>
      </div>
      <section className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {files.map(withTypeInfo).map(({ typeInfo, ...file }) => (
            <a
              key={file.name}
              href={`${config.urls.files}/${zon}/${file.name}`}
              className="block bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-200 overflow-hidden border border-gray-100 group"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <i
                      data-lucide={typeInfo?.icon}
                      className={`h-5 w-5 text-${typeInfo.color}-500`}
                    >
                    </i>
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
                      <i data-lucide="edit" className="h-4 w-4 mr-1"></i>
                      <span>Edit</span>
                    </div>
                    {file.type === "http" && (
                      <div className="flex items-center">
                        <i data-lucide="external-link" className="h-4 w-4 mr-1"></i>
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
          <i data-lucide="folder-open" className="h-16 w-16 text-gray-400 mx-auto mb-4"></i>
          <h3 className="text-xl font-medium text-gray-900 mb-2">No files found</h3>
          <p className="text-gray-600">This zon doesn't contain any files yet.</p>
        </div>
      )}
    </main>,
  );
});

export default app.fetch;
