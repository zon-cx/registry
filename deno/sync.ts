import { getDoc, openKv } from "./store.ts";
import ValTown from "npm:@valtown/sdk";

// Single source of truth: everything is written into the shared `@vals` Yjs
// document via the KV interface. Content is stored in `doc.getText(key)` (the
// exact Y.Text the collaborative <ts-editor> binds to), and all metadata lives
// in the `kv` map. We also mirror the file list into a top-level `files` map so
// the editor's file tree keeps working.
const kv = openKv();
const client = new ValTown();

export default async function(interval: Interval) {
  try {
    await sync();
  } catch (err) {
    console.error(err);
    return;
  }
  console.log("Finished syncing all Val Town vals and files to Yjs storage");
}

export async function sync() {
  console.log(`Running Val Town to Yjs sync: ${new Date().toISOString()}`);

  const vals = await client.me.vals.list({
    limit: 100,
    offset: 0,
  }).then(res => res.data);

  // Store list of zons for the zons page
  const zonsList = vals.map(val => ({
    name: val.name,
    id: val.id,
    description: val.description || "",
    createdAt: val.createdAt || "",
    author: val.author || { username: "" },
    type: val.type || "",
    likeCount: 0,
    referenceCount: 0,
  }));

  await kv.set("zons:list", zonsList);
  console.log(`Stored ${zonsList.length} zons in list`);

  for (const val of vals) {
    await valSync(val);
  }

  // Make sure the final changes reach the Yjs server before we exit.
  await kv.flush();
}

type File = {
  path: string;
  type: "file" | "directory" | "http";
  name: string;
  val: string;
  key: string;
  lastModified: string;
  version: string;
} & Record<string, any>;

async function valSync({ id, name, ...meta }: { name: string; id: string }) {
  try {
    const files = await (client.vals.files.retrieve(id, {
      path: "",
      recursive: true,
    }) as Promise<{ data: File[] }>)
      .then(res => res.data)
      .then(ff =>
        ff.map(({ path, name: fileName, ...file }) => ({
          ...file,
          key: `${name}:${path || fileName}`,
          path,
          name: fileName,
          val: id,
        }))
      );

    const filteredFiles = files.filter(({ type }) => type !== "directory");

    // Mirror the val + file list into the shared Yjs doc's structured maps so
    // the editor's file tree (which reads `getMap(name)` / `getMap("files")`)
    // stays in sync alongside the KV metadata.
    const doc = await getDoc();
    const valMap = doc.getMap(name);
    const fileMap = doc.getMap<{ path: string; type: "file" | "http" | "directory" }>("files");
    doc.transact(() => {
      valMap.set("name", name);
      valMap.set("id", id);
      for (const [key, val] of Object.entries(meta)) {
        valMap.set(key, val as any);
      }
      valMap.set("files", filteredFiles.map(({ key }) => key));

      filteredFiles.forEach(({ key, ...file }) =>
        fileMap.set(key, {
          ...file,
          val: id,
        } as any)
      );
    });

    // Store val metadata
    await kv.set(`val:${name}`, {
      name,
      id,
      ...meta,
      files: filteredFiles.map(({ key }) => key),
    });

    // Store each file's metadata and content
    for (const { key, ...file } of filteredFiles) {
      await kv.set(`file:${key}`, { ...file, val: id });

      try {
        const content = await client.vals.files.getContent(id, {
          path: file.path,
          name: file.name,
        }).then(res => res.text());

        // `content:` keys write straight into doc.getText(key) via the store,
        // which is what the live editor renders.
        await kv.set(`content:${key}`, content);

        console.log(`Synced file to Yjs: ${key}`);
      } catch (err) {
        console.error(`Error syncing content for ${key}:`, err);
      }
    }

    console.log(`Synced val to Yjs: ${name} with ${filteredFiles.length} files`);
  } catch (err) {
    console.error(`Error syncing val ${name}:`, err);
  }
}
