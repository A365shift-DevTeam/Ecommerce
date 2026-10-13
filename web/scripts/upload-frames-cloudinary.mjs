// Uploads the 120 showroom frames in ../converted to Cloudinary as gruham/hero/frame_001..120.
// Reads credentials from ../.env.local. Safe to rerun: existing frames are skipped unless --force.
import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
dotenv.config({ path: path.join(root, ".env.local") });

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.error("Missing CLOUDINARY_* values in .env.local");
  process.exit(1);
}
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true,
});

const force = process.argv.includes("--force");
const srcDir = path.join(root, "converted");
const files = (await readdir(srcDir)).filter((f) => f.endsWith(".webp")).sort();

async function exists(publicId) {
  try {
    await cloudinary.api.resource(publicId);
    return true;
  } catch {
    return false;
  }
}

let done = 0;
async function uploadOne(file, i) {
  const publicId = `gruham/hero/frame_${String(i + 1).padStart(3, "0")}`;
  if (!force && (await exists(publicId))) {
    done++;
    console.log(`skip  ${publicId} (${done}/${files.length})`);
    return;
  }
  await cloudinary.uploader.upload(path.join(srcDir, file), {
    public_id: publicId,
    asset_folder: "gruham/hero",
    overwrite: true,
    resource_type: "image",
  });
  done++;
  console.log(`up    ${publicId} (${done}/${files.length})`);
}

const queue = files.map((f, i) => () => uploadOne(f, i));
const workers = Array.from({ length: 6 }, async () => {
  while (queue.length) {
    const job = queue.shift();
    for (let attempt = 1; ; attempt++) {
      try {
        await job();
        break;
      } catch (err) {
        if (attempt >= 3) throw err;
        console.warn(`retry ${attempt}: ${err.message ?? err}`);
      }
    }
  }
});
await Promise.all(workers);
console.log(`Done. ${files.length} frames at gruham/hero/frame_001..${String(files.length).padStart(3, "0")}`);
