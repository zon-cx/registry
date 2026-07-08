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

// Helper function to detect if file is README/Markdown type
function isReadmeFile(filename: string, valType?: string): boolean {
  const lowerFilename = filename.toLowerCase();
  return lowerFilename.includes("readme")
    || lowerFilename.endsWith(".md")
    || valType === "md";
}

// JSX renderer setup
app.use(
  "*",
  jsxRenderer(({ children }: PropsWithChildren) => {
    return (
      <html lang="en">
        <head>
          <title>README File Editor</title>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <script src="https://unpkg.com/@tailwindcss/browser@4"></script>
          <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
          <script src="https://esm.sh/@cxai/ide@1.0.19" type="module"></script>
          <style>
            {`
            .file-type-readme { @apply border-l-4 border-gray-500; }
            .readme-indicator { @apply bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium; }
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
  return c.redirect(`/${config.main.zon}/${config.main.readme}`);
});

// API endpoint to get specific file content
app.get("/:zon/:file/raw", async (c: Context) => {
  const { zon, file } = c.req.param();
  const kv = openKv();

  try {
    // Get file metadata to check if it's README type
    const fileKey = `${zon}:${file}`;
    const fileData = await kv.get(`file:${fileKey}`);

    if (!isReadmeFile(file, fileData?.type)) {
      return c.json({ error: `File '${file}' is not a README/Markdown file` }, 400);
    }

    // Get file content from KV
    const content = await kv.get(`content:${fileKey}`);

    if (!content) {
      return c.json({ error: `File '${file}' not found in zon '${zon}'` }, 404);
    }

    return c.json({ content, file, zon, type: "readme" });
  } catch (error) {
    console.error("Error fetching README file:", error);
    return c.json({ error: "Failed to fetch README file content" }, 500);
  }
});

// README file editor view
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

    if (!isReadmeFile(file, valType)) {
      return c.render(
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Not a README File</h1>
            <p className="text-gray-600 mb-4">The file "{file}" is not a README/Markdown file type.</p>
            <a href={`${config.urls.zon}/${zon}`} className="text-blue-600 hover:text-blue-800">← Back to Zon</a>
          </div>
        </div>,
      );
    }

    const fileType = FILE_TYPES.md;

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
                    <div className="flex items-center space-x-2">
                      <h1 className="text-xl font-semibold text-gray-900">{file}</h1>
                      <span className="readme-indicator">README</span>
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
                    <i data-lucide="save" className="h-4 w-4 mr-2"></i>
                    Save
                  </button>
                </form>
                <button
                  type="button"
                  id="previewButton"
                  className="flex items-center px-4 py-2 rounded-md text-white bg-gray-500 hover:bg-gray-600 transition-colors"
                  onclick="togglePreview()"
                >
                  <i data-lucide="eye" className="h-4 w-4 mr-2"></i>
                  Preview
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-4">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden file-type-readme">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <i data-lucide="file-text" className="h-4 w-4 text-gray-600"></i>
                <span className="text-sm font-medium text-gray-800">Documentation</span>
                <span className="text-xs text-gray-600">• Markdown documentation and README files</span>
              </div>
            </div>
            <div className="h-[calc(100vh-16rem)] w-full">
              <ts-editor
                id="editor"
                component={`${zon}:${file}`}
                room={config.editor.yjs.room}
                url={config.editor.yjs.url}
                className="h-full w-full"
                language="markdown"
              >
              </ts-editor>
            </div>
          </div>
        </div>

        <script
          dangerouslySetInnerHTML={{
            __html: `
            function togglePreview() {
              // This would toggle between edit and preview mode
              // For now, just show a message
              alert('Preview functionality would be implemented here');
            }
          `,
          }}
        />
      </div>,
    );
  } catch (error) {
    console.error("Error loading README file editor:", error);
    return c.render(
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">Failed to load README file editor.</p>
          <a href={config.urls.zons} className="text-blue-600 hover:text-blue-800">← Back to Gallery</a>
        </div>
      </div>,
    );
  }
});

const authorization = createMiddleware(async function(c: Context) {
  // Authorization disabled for development
  return;
});

// Save README file endpoint
app.post("/:zon/:file", authorization, async (c: Context) => {
  const { zon, file } = c.req.param();
  const { content } = await c.req.json();
  const kv = openKv();

  try {
    // Verify it's a README file
    const fileKey = `${zon}:${file}`;
    const fileData = await kv.get(`file:${fileKey}`);

    if (!isReadmeFile(file, fileData?.type)) {
      return c.json({ error: "File is not a README/Markdown file" }, 400);
    }

    // Save file content to KV
    await kv.set(`content:${fileKey}`, content);

    return c.json({ success: true, message: "README file saved successfully" });
  } catch (error: unknown) {
    console.error("Error saving README file:", error);
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