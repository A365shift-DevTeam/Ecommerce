// Uploads the client's half-saree photos (full resolution, untouched) and one extra CC0 jewellery set.
import { execFileSync } from "node:child_process";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
dotenv.config({ path: path.join(root, ".env.local"), quiet: true });
cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET, secure: true });

const wa = path.join(root, "WhatsApp Unknown 2026-10-13 at 12.20.34 PM");
const uploads = [
  ["halfsaree-rust-maroon", path.join(wa, "WhatsApp Image 2026-10-12 at 2.46.36 PM (1).jpeg")],
  ["halfsaree-kalamkari-rani", path.join(wa, "WhatsApp Image 2026-10-12 at 2.46.36 PM (2).jpeg")],
  ["halfsaree-lavender-peacock", path.join(wa, "WhatsApp Image 2026-10-12 at 2.46.36 PM.jpeg")],
  ["halfsaree-kalamkari-navy", path.join(wa, "WhatsApp Image 2026-10-12 at 2.46.37 PM.jpeg")],
];

// CC0 necklace + earrings set (Metropolitan Museum of Art), padded to 4:5 on its own backdrop.
const work = path.join(root, "web", ".image-work");
await mkdir(path.join(work, "src"), { recursive: true });
const src = path.join(work, "src", "jewel-bridal-set.jpg");
const res = await fetch(`https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent("Necklace and Pair of Earrings MET DP-15524-001.jpg")}?width=2000`, { headers: { "User-Agent": "GruhamDemo/1.0" } });
await writeFile(src, Buffer.from(await res.arrayBuffer()));
const out = path.join(work, "out", "jewel-bridal-set.jpg");
const [w, h] = execFileSync("magick", [src, "-resize", "1500x2000", "-format", "%w %h", "info:"]).toString().trim().split(" ").map(Number);
execFileSync("magick", [src, "-resize", "1500x2000", "-set", "option:distort:viewport", `1500x2000-${Math.round((1500 - w) / 2)}-${Math.round((2000 - h) / 2)}`, "-virtual-pixel", "Edge", "-distort", "SRT", "0", "+repage", "-quality", "92", out]);
uploads.push(["jewel-bridal-set", out]);

for (const [id, file] of uploads) {
  await cloudinary.uploader.upload(file, { public_id: `gruham/catalog/${id}`, asset_folder: "gruham/catalog", overwrite: true, invalidate: true });
  console.log("up", id);
}
