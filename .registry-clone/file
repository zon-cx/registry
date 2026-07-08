/** @jsxImportSource npm:hono@latest/jsx */

import { openKv } from "https://esm.town/v/pomdtr/kv";
import { Hono } from "npm:hono";
import { Context } from "npm:hono";
import { createMiddleware } from "npm:hono/factory";
import { PropsWithChildren } from "npm:hono/jsx";
import { jsxRenderer } from "npm:hono/jsx-renderer";
import config from "./config.json" with { type: "json" };

const app = new Hono();

// File type definitions from config
interface FileType {
  name: string;
  extension: string;
  icon: string;
  color: string;
  description: string;
  template: string;
}

const FILE_TYPES: Record<string, FileType> = config.fileTypes || {};

// Helper function to detect file type
function detectFileType(filename: string, valType?: string): FileType {
  if (valType && FILE_TYPES[valType]) {
    return FILE_TYPES[valType];
  }

  const extension = filename.split(".").pop()?.toLowerCase();

  // Check by extension
  for (const [key, type] of Object.entries(FILE_TYPES)) {
    if (type.extension === extension) {
      return type;
    }
  }

  // Default to TypeScript if available, otherwise first available type
  return FILE_TYPES.ts || Object.values(FILE_TYPES)[0] || {
    name: "File",
    extension: "txt",
    icon: "file",
    color: "gray",
    description: "Generic file",
    template: "",
  };
}

// JSX renderer setup
app.use(
  "*",
  jsxRenderer(({ children }: PropsWithChildren) => {
    return (
      <html lang="en">
        <head>
          <title>Zon File Editor</title>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <script src="https://unpkg.com/@tailwindcss/browser@4"></script>
          <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
          <script src="https://esm.sh/@cxai/ide@1.0.19" type="module"></script>
          <style>
            {`
            .file-type-http { @apply border-l-4 border-green-500; }
            .file-type-cron { @apply border-l-4 border-blue-500; }
            .file-type-email { @apply border-l-4 border-purple-500; }
            .file-type-json { @apply border-l-4 border-yellow-500; }
            .file-type-ts { @apply border-l-4 border-blue-600; }
            .file-type-js { @apply border-l-4 border-yellow-600; }
            .file-type-md { @apply border-l-4 border-gray-500; }
          `}
          </style>
        </head>
        <body className="bg-gray-50 min-h-screen">
          <div id="app">{children}</div>
          <script dangerouslySetInnerHTML={{ __html: `lucide.createIcons();` }} />
        </body>
      </html>
    );
  }),
);

// Routes

app.get("/", async (c: Context) => {
  return c.redirect(`/${config.main.zon}/${config.main.http}`);
});

// File editor view
app.get("/:zon/:file", async (c: Context) => {
  const { zon, file } = c.req.param();
  const kv = openKv();

  try {
    // Get val metadata from KV
    const valData = await kv.get(`val:${zon}`);

    if (!valData) {
      return c.render(
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Zon Not Found</h1>
            <p className="text-gray-600 mb-4">The zon "{zon}" could not be found.</p>
            <a href={config.urls.zons} className="text-blue-600 hover:text-blue-800">← Back to Gallery</a>
          </div>
        </div>,
      );
    }

    // Get file metadata from KV
    const fileKey = `${zon}:${file}`;
    const fileData = await kv.get(`file:${fileKey}`);
    const valType = fileData?.type || "ts";

    const fileType = detectFileType(file, valType);

    return c.render(
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <a href={`${config.urls.zon}/${zon}`} className="text-blue-600 hover:text-blue-800">
                  <i data-lucide="arrow-left" className="h-5 w-5"></i>
                </a>
                <div className="flex items-center space-x-3">
                  <i data-lucide={fileType.icon} className={`h-6 w-6 text-${fileType.color}-500`}></i>
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900">{file}</h1>
                    <p className="text-sm text-gray-600">{zon} • {fileType.name}</p>
                  </div>
                </div>
              </div>
              <form className="flex items-center space-x-3" action={`/${zon}/${file}`} method="post">
                <button
                  type="submit"
                  id="saveButton"
                  className="flex items-center px-4 py-2 rounded-md text-white bg-blue-500 hover:bg-blue-600 transition-colors"
                >
                  <i data-lucide="save" className="h-4 w-4 mr-2"></i>
                  Save
                </button>
                <button
                  type="button"
                  id="runButton"
                  className="flex items-center px-4 py-2 rounded-md text-white bg-green-500 hover:bg-green-600 transition-colors"
                >
                  <i data-lucide="play" className="h-4 w-4 mr-2"></i>
                  Run
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-4">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="h-[calc(100vh-12rem)] w-full">
              <ts-editor
                id="editor"
                component={`${zon}:${file}`}
                room={config.editor.yjs.room}
                url={config.editor.yjs.url}
                className="h-full w-full"
              >
              </ts-editor>
            </div>
          </div>
        </div>
      </div>,
    );
  } catch (error) {
    console.error("Error loading file editor:", error);
    return c.render(
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">Failed to load file editor.</p>
          <a href="/registry" className="text-blue-600 hover:text-blue-800">← Back to Registry</a>
        </div>
      </div>,
    );
  }
});

// API endpoint to get specific file content
app.get("/:zon/:file/raw", async (c: Context) => {
  const { zon, file } = c.req.param();
  const kv = openKv();

  try {
    // Get file content from KV
    const fileKey = `${zon}:${file}`;
    const content = await kv.get(`content:${fileKey}`);

    if (!content) {
      return c.json({ error: `File '${file}' not found in zon '${zon}'` }, 404);
    }

    return c.json({ content, file, zon });
  } catch (error) {
    console.error("Error fetching file:", error);
    return c.json({ error: "Failed to fetch file content" }, 500);
  }
});

const authorization = createMiddleware(async function(c: Context) {
  const { zon, file } = c.req.param();

  return c.redirect(`/${zon}/${file}?error=401`);
});

// Save file endpoint
app.post("/:zon/:file", authorization, async (c: Context) => {
  const { zon, file } = c.req.param();
  const { content } = await c.req.json();
  const kv = openKv();

  try {
    // Save file content to KV
    const fileKey = `${zon}:${file}`;
    await kv.set(`content:${fileKey}`, content);

    return c.json({ success: true, message: "File saved successfully to KV" });
  } catch (error: unknown) {
    console.error("Error saving file:", error);
    return c.json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});

// Unwrap Hono errors to see original error details
app.onError((err, c) => {
  console.error(err);
  throw err;
});

// Start the server
export default app.fetch;