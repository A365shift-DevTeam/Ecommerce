// Builds the demo catalogue imagery and uploads it to Cloudinary under gruham/catalog/*.
// Sources: crops from the showroom frames, crops from the Gruham logo artwork, and CC0 /
// public-domain museum photographs from Wikimedia Commons (listed in sources.json).
// These are placeholders until the client supplies real product photography.
import { execFileSync } from "node:child_process";
import { mkdir, writeFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
dotenv.config({ path: path.join(root, ".env.local") });
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const work = path.join(root, "web", ".image-work");
await mkdir(path.join(work, "src"), { recursive: true });
await mkdir(path.join(work, "out"), { recursive: true });

const frame = (n) => path.join(root, "converted", `${String(n).padStart(8, "0")}.webp`);
const logo = path.join(work, "src", "logo.png");
const magick = (...args) => execFileSync("magick", args, { stdio: "inherit" });

// crop: [w, h, x, y] in source pixels
const frameCrops = {
  "saree-red-bridal": [110, [1100, 1375, 1500, 700]],
  "saree-red-portrait": [115, [1536, 1920, 1372, 240]],
  "saree-red-pallu": [115, [736, 920, 2000, 1240]],
  "saree-gold-tissue": [30, [1160, 1450, 160, 500]],
  "saree-peacock-green": [30, [1160, 1450, 2508, 500]],
  "saree-rust-green": [30, [1160, 1450, 1960, 560]],
  "saree-rust-mannequin": [40, [1376, 1720, 232, 360]],
  "saree-orange-green": [40, [1400, 1750, 2240, 400]],
  "saree-amber-silk": [55, [1660, 2075, 2170, 80]],
  "saree-emerald-drape": [65, [1000, 1250, 1020, 480]],
  "saree-rack": [75, [1100, 1375, 700, 280]],
  "saree-seated-red": [75, [1240, 1550, 2240, 520]],
  "jewel-model-necklace": [115, [720, 900, 1620, 520]],
};
// Wide editorial crops (16:9 or 21:9), not product shots
const wideCrops = {
  "wide-shelves": [115, [3840, 1646, 0, 260]],
  "wide-entrance": [10, [3840, 2160, 0, 0]],
  "wide-mannequins": [30, [3840, 2160, 0, 0]],
  "wide-rack": [70, [3840, 2160, 0, 0]],
  "wide-model": [110, [3840, 2160, 0, 0]],
};
const logoCrops = {
  "jewel-logo-necklace": [[300, 375, 175, 0]],
  "jewel-logo-casket": [[380, 270, 790, 0]],
};

const commons = {
  "saree-sambalpuri-red": "Sari, Orissa, India, view 1, 2000, silk, gold thread - Textile Museum of Canada - DSC00960.JPG",
  "saree-banarasi-violet": "Sari, Varanasi, Uttar Pradesh, India, view 1, 20th century, silk, gold thread - Textile Museum of Canada - DSC00954.JPG",
  "saree-banarasi-violet-detail": "Sari, Varanasi, Uttar Pradesh, India, view 2, 20th century, silk, gold thread - Textile Museum of Canada - DSC00956.JPG",
  "saree-banarasi-red-pallu": "Banarasi sari pallu by ashish4.JPG",
  "saree-soft-silk-mustard": "Saree29.jpg",
  "saree-ivory-tissue": "Sari, Varanasi, Uttar Pradesh, India, 1960s, silk, gold thread, satin - Textile Museum of Canada - DSC00943.JPG",
  "jewel-temple-necklace": "MET DT5241.jpg",
  "jewel-spike-necklace": "MET DT6630.jpg",
  "jewel-kemp-necklace": "Necklace MET DP-14795-004.jpg",
  "jewel-chain-pendant": "Necklace MET LC-15 95 104.jpg",
  "jewel-layered-haar": "Necklace (Panchlari) MET LC-15 95 79.jpg",
  "jewel-coin-mala": "Necklace MET LC-15 95 108.jpg",
  "jewel-lotus-pendant": "Necklace MET LC-15 95 53.jpg",
  "jewel-emerald-beads": "Necklace MET LC-91 1 1157.jpg",
  "jewel-gold-earrings": "MET DT234.jpg",
  "jewel-enamel-bangle": "Inlaid bangle bracelet Bracelet, 18th–19th century (CH 18647655).jpg",
};

async function fileExists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function download(title, dest) {
  if (await fileExists(dest)) return;
  const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(title)}?width=1800`;
  const res = await fetch(url, { headers: { "User-Agent": "GruhamDemo/1.0 (demo build)" } });
  if (!res.ok) throw new Error(`${res.status} for ${title}`);
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
}

const outputs = [];
const P = (id) => path.join(work, "out", `${id}.jpg`);

// Product images: 1200x1500, 4:5
for (const [id, [n, [w, h, x, y]]] of Object.entries(frameCrops)) {
  magick(frame(n), "-crop", `${w}x${h}+${x}+${y}`, "+repage", "-resize", "1200x1500^", "-gravity", "center", "-extent", "1200x1500", "-unsharp", "0x0.8+0.6+0.02", "-quality", "90", P(id));
  outputs.push(id);
}
for (const [id, [n, [w, h, x, y]]] of Object.entries(wideCrops)) {
  magick(frame(n), "-crop", `${w}x${h}+${x}+${y}`, "+repage", "-resize", "2400x", "-quality", "86", P(id));
  outputs.push(id);
}
magick(path.join(root, "gruham logo.heic"), logo);
for (const [id, [[w, h, x, y]]] of Object.entries(logoCrops)) {
  magick(logo, "-crop", `${w}x${h}+${x}+${y}`, "+repage", "-resize", "1200x1500^", "-gravity", "center", "-extent", "1200x1500", "-quality", "90", P(id));
  outputs.push(id);
}
// Full logo artwork as an editorial banner, and the circular G emblem as the brand mark
magick(logo, "-quality", "90", P("brand-artwork"));
outputs.push("brand-artwork");
magick(logo, "-crop", "400x400+376+60", "+repage", "(", "-size", "400x400", "xc:none", "-fill", "white", "-draw", "circle 200,200 200,6", ")", "-compose", "DstIn", "-composite", path.join(work, "out", "brand-mark.png"));

const sources = [];
for (const [id, title] of Object.entries(commons)) {
  const src = path.join(work, "src", `${id}.jpg`);
  await download(title, src);
  if (["saree-banarasi-red-pallu", "saree-banarasi-violet-detail", "saree-soft-silk-mustard"].includes(id)) {
    // Fabric fills the frame: cover-crop instead.
    magick(src, "-resize", "1200x1500^", "-gravity", "center", "-extent", "1200x1500", "-quality", "90", P(id));
  } else {
  // Museum shots: fit inside 4:5 and extend the photo's own edge pixels to fill, so nothing is cut off
  // and the padding matches the studio backdrop.
  const [w, h] = execFileSync("magick", [src, "-resize", "1200x1500", "-format", "%w %h", "info:"]).toString().trim().split(" ").map(Number);
  const ox = Math.round((1200 - w) / 2);
  const oy = Math.round((1500 - h) / 2);
  magick(src, "-resize", "1200x1500", "-set", "option:distort:viewport", `1200x1500-${ox}-${oy}`, "-virtual-pixel", "Edge", "-distort", "SRT", "0", "+repage", "-quality", "90", P(id));
  }
  outputs.push(id);
  sources.push({ id, title, url: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(title.replace(/ /g, "_"))}`, license: "CC0 / public domain" });
}
await writeFile(path.join(root, "web", "scripts", "sources.json"), JSON.stringify(sources, null, 2));

if (process.argv.includes("--no-upload")) process.exit(0);

// Upload
const all = [...outputs.map((id) => [id, P(id)]), ["brand-mark", path.join(work, "out", "brand-mark.png")]];
const queue = [...all];
await Promise.all(
  Array.from({ length: 6 }, async () => {
    while (queue.length) {
      const [id, file] = queue.shift();
      await cloudinary.uploader.upload(file, { public_id: `gruham/catalog/${id}`, asset_folder: "gruham/catalog", overwrite: true, invalidate: true });
      console.log("up", id);
    }
  }),
);
console.log(`Uploaded ${all.length} images to gruham/catalog/`);
