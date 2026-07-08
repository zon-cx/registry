import * as Y from "https://esm.sh/yjs@13.6.23?target=esnext";
import { connectYjs } from "https://esm.town/v/dinavinter/connect";
import { openKv } from "https://esm.town/v/pomdtr/kv";
import ValTown from "npm:@valtown/sdk";

const kv = openKv();
const valsDoc = connectYjs(`@vals`);
const fileMap = valsDoc.getMap<{ path: string; type: "file" | "http" | "directory" }>("files");
const client = new ValTown();

export default async function(interval: Interval) {
  try {
    await sync();
  } catch (err) {
    console.error(err);
    return;
  }
  console.log("Finished syncing all Val Town vals and files to both Yjs and KV storage");
}

export async function sync() {
  console.log(`Running Val Town to Yjs and KV sync: ${new Date().toISOString()}`);

  const vals = await client.me.vals.list({
    limit: 100,
    offset: 0,
  }).then(res => res.data);

  // Store list of zons in KV for the zons page
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
  console.log(`Stored ${zonsList.length} zons in KV list`);

  for (const val of vals) {
    await valSync(val);
  }
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

    // Sync to Yjs
    const valMap = valsDoc.getMap(name);
    valsDoc.transact(() => {
      valMap.set("name", name);
      valMap.set("id", id);
      for (const [key, val] of Object.entries(meta)) {
        valMap.set(key, val);
      }
      valMap.set("files", filteredFiles.map(({ key }) => key));

      filteredFiles.forEach(({ key, ...file }) =>
        fileMap.set(key, {
          ...file,
          val: id,
        })
      );
    });

    // Store val metadata in KV
    const valData = {
      name,
      id,
      ...meta,
      files: filteredFiles.map(({ key }) => key),
    };
    
    await kv.set(`val:${name}`, valData);

    // Store each file metadata and content in KV, and sync content to Yjs
    for (const { key, ...file } of filteredFiles) {
      // Store file metadata in KV
      await kv.set(`file:${key}`, {
        ...file,
        val: id,
      });

      // Get and store file content
      try {
        const content = await client.vals.files.getContent(id, { 
          path: file.path, 
          name: file.name 
        }).then(res => res.text());
        
        // Sync content to Yjs
        const yText = valsDoc.getText(key);
        valsDoc.transact(() => {
          yText.delete(0, yText.length);
          yText.insert(0, content);
        });
        
        // Store content in KV (with size limit)
        if (content.length < 1000000) {
          await kv.set(`content:${key}`, content);
        } else {
          console.warn(`Skipping large file ${key} (${content.length} chars) for KV storage`);
        }
        
        console.log(`Synced file to both Yjs and KV: ${key}`);
      } catch (err) {
        console.error(`Error syncing content for ${key}:`, err);
      }
    }

    console.log(`Synced val to both Yjs and KV: ${name} with ${filteredFiles.length} files`);
  } catch (err) {
    console.error(`Error syncing val ${name}:`, err);
  }
}