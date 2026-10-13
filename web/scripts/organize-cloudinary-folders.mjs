// Moves uploaded assets into Media Library folders (dynamic-folder accounts ignore the public_id path).
// Public IDs and delivery URLs do not change.
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
dotenv.config({ path: path.join(root, ".env.local"), quiet: true });
cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET, secure: true });

for (const folder of ["gruham", "gruham/hero", "gruham/catalog"]) {
  await cloudinary.api.create_folder(folder).catch(() => {});
}

async function listAll(prefix) {
  const out = [];
  let next;
  do {
    const r = await cloudinary.api.resources({ type: "upload", prefix, max_results: 500, next_cursor: next });
    out.push(...r.resources);
    next = r.next_cursor;
  } while (next);
  return out;
}

for (const [prefix, folder] of [["gruham/hero/", "gruham/hero"], ["gruham/catalog/", "gruham/catalog"]]) {
  const items = await listAll(prefix);
  const queue = [...items];
  let n = 0;
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (queue.length) {
      const r = queue.shift();
      if (r.asset_folder === folder) { n++; continue; }
      await cloudinary.api.update(r.public_id, { asset_folder: folder });
      n++;
    }
  }));
  console.log(`${folder}: ${n} assets`);
}
