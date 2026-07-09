/** @jsxImportSource npm:hono@latest/jsx */

import { openKv } from "./store.ts";
import { Hono } from "npm:hono";
import { Context } from "npm:hono";
import { createMiddleware } from "npm:hono/factory";
import config from "./config.json" with { type: "json" };
import { urls } from "./urls.ts";
import { createApp } from "./renderer.tsx";

// Routes only. The HTML shell/renderer lives in renderer.tsx and is applied
// once — by the combined router (main.tsx) or by the standalone `export default`
// below. This keeps each file type as its own self-contained set of routes.
const handler = new Hono();

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

// Routes

handler.get("/", async (c: Context) => {
  return c.redirect(`/${config.main.zon}/${config.main.http}`);
});

// File editor view
handler.get("/:zon/:file", async (c: Context) => {
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
            <a href={urls.zons} className="text-blue-600 hover:text-blue-800">← Back to Gallery</a>
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
                <a href={`${urls.zon}/${zon}`} className="text-blue-600 hover:text-blue-800">
                  <iconify-icon icon="lucide:arrow-left" className="h-5 w-5"></iconify-icon>
                </a>
                <div className="flex items-center space-x-3">
                  <iconify-icon icon={`lucide:${fileType.icon}`} className={`h-6 w-6 text-${fileType.color}-500`}></iconify-icon>
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
                  <iconify-icon icon="lucide:save" className="h-4 w-4 mr-2"></iconify-icon>
                  Save
                </button>
                <button
                  type="button"
                  id="runButton"
                  className="flex items-center px-4 py-2 rounded-md text-white bg-green-500 hover:bg-green-600 transition-colors"
                >
                  <iconify-icon icon="lucide:play" className="h-4 w-4 mr-2"></iconify-icon>
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
          <a href={urls.zons} className="text-blue-600 hover:text-blue-800">← Back to Gallery</a>
        </div>
      </div>,
    );
  }
});

// API endpoint to get specific file content
handler.get("/:zon/:file/raw", async (c: Context) => {
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
handler.post("/:zon/:file", authorization, async (c: Context) => {
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
handler.onError((err, c) => {
  console.error(err);
  throw err;
});

// Routes for the combined router (main.tsx) to compose.
export { handler };

// Standalone Val Town deploy: wrap the routes in the shared renderer.
export default createApp().route("/", handler).fetch;
