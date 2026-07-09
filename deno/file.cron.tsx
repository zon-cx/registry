/** @jsxImportSource npm:hono@latest/jsx */

import { openKv } from "./store.ts";
import { Hono } from "npm:hono";
import { Context } from "npm:hono";
import { createMiddleware } from "npm:hono/factory";
import config from "./config.json" with { type: "json" };
import { urls } from "./urls.ts";
import { createApp } from "./renderer.tsx";

// Routes only — the shell/renderer is applied once by main.tsx (combined) or by
// the standalone `export default` at the bottom of this file.
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

// Helper function to detect if file is Cron type
function isCronFile(filename: string, valType?: string): boolean {
  return valType === "interval" || valType === "cron";
}

// Routes

handler.get("/", async (c: Context) => {
  return c.redirect(`/${config.main.zon}/${config.main.cron}`);
});

// API endpoint to get specific file content
handler.get("/:zon/:file/raw", async (c: Context) => {
  const { zon, file } = c.req.param();
  const kv = openKv();

  try {
    // Get file metadata to check if it's Cron type
    const fileKey = `${zon}:${file}`;
    const fileData = await kv.get(`file:${fileKey}`);

    if (!isCronFile(file, fileData?.type)) {
      return c.json({ error: `File '${file}' is not a Cron file` }, 400);
    }

    // Get file content from KV
    const content = await kv.get(`content:${fileKey}`);

    if (!content) {
      return c.json({ error: `File '${file}' not found in zon '${zon}'` }, 404);
    }

    return c.json({ content, file, zon, type: "cron" });
  } catch (error) {
    console.error("Error fetching Cron file:", error);
    return c.json({ error: "Failed to fetch Cron file content" }, 500);
  }
});

// Cron file editor view
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

    if (!isCronFile(file, valType)) {
      return c.render(
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Not a Cron File</h1>
            <p className="text-gray-600 mb-4">The file "{file}" is not a Cron file type.</p>
            <a href={`${urls.zon}/${zon}`} className="text-blue-600 hover:text-blue-800">← Back to Zon</a>
          </div>
        </div>,
      );
    }

    const fileType = FILE_TYPES.interval;

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
                    <div className="flex items-center space-x-2">
                      <h1 className="text-xl font-semibold text-gray-900">{file}</h1>
                      <span className="cron-indicator bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">CRON</span>
                    </div>
                    <p className="text-sm text-gray-600">{zon} • {fileType.description}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <form className="flex items-center space-x-3" action={`/${zon}/${file}`} method="post">
                  <button
                    type="submit"
                    id="saveButton"
                    className="flex items-center px-4 py-2 rounded-md text-white bg-blue-500 hover:bg-blue-600 transition-colors"
                  >
                    <iconify-icon icon="lucide:save" className="h-4 w-4 mr-2"></iconify-icon>
                    Save
                  </button>
                </form>
                <button
                  type="button"
                  id="scheduleButton"
                  className="flex items-center px-4 py-2 rounded-md text-white bg-blue-500 hover:bg-blue-600 transition-colors"
                  onclick={`window.open('https://val.town/v/${zon}', '_blank')`}
                >
                  <iconify-icon icon="lucide:clock" className="h-4 w-4 mr-2"></iconify-icon>
                  Schedule
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-4">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden border-l-4 border-blue-500">
            <div className="bg-blue-50 px-4 py-2 border-b border-blue-200">
              <div className="flex items-center space-x-2">
                <iconify-icon icon="lucide:clock" className="h-4 w-4 text-blue-600"></iconify-icon>
                <span className="text-sm font-medium text-blue-800">Scheduled Task</span>
                <span className="text-xs text-blue-600">• Runs on a schedule (configure in Val Town UI)</span>
              </div>
            </div>
            <div className="h-[calc(100vh-16rem)] w-full">
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
    console.error("Error loading Cron file editor:", error);
    return c.render(
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">Failed to load Cron file editor.</p>
          <a href={urls.zons} className="text-blue-600 hover:text-blue-800">← Back to Gallery</a>
        </div>
      </div>,
    );
  }
});

const authorization = createMiddleware(async function(c: Context) {
  // Authorization disabled for development
  return;
});

// Save Cron file endpoint
handler.post("/:zon/:file", authorization, async (c: Context) => {
  const { zon, file } = c.req.param();
  const { content } = await c.req.json();
  const kv = openKv();

  try {
    // Verify it's a Cron file
    const fileKey = `${zon}:${file}`;
    const fileData = await kv.get(`file:${fileKey}`);

    if (!isCronFile(file, fileData?.type)) {
      return c.json({ error: "File is not a Cron file" }, 400);
    }

    // Save file content to KV
    await kv.set(`content:${fileKey}`, content);

    return c.json({ success: true, message: "Cron file saved successfully" });
  } catch (error: unknown) {
    console.error("Error saving Cron file:", error);
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
