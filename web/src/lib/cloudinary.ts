const cloud = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dghhdz3et";
const useCloudinary = import.meta.env.VITE_USE_CLOUDINARY !== "false";
const base = `https://res.cloudinary.com/${cloud}/image/upload`;

export const HERO_FRAME_COUNT = 120;

/** Catalogue sources are 1200px wide; c_limit never upscales, so wider requests only duplicate cache entries. */
const CATALOG_MAX_WIDTH = 1200;

/**
 * Catalogue image by id, compressed with Cloudinary's standard automatic quality (q_auto).
 * Data URLs and absolute URLs (admin uploads) pass through untouched.
 */
export function img(id: string, width = 800): string {
  if (id.startsWith("data:") || id.startsWith("http") || id.startsWith("blob:")) return id;
  return `${base}/f_auto,q_auto,c_limit,w_${Math.min(width, CATALOG_MAX_WIDTH)}/gruham/catalog/${id}`;
}

export function srcSet(id: string, widths = [320, 480, 720, 960, 1200]): string | undefined {
  if (id.startsWith("data:") || id.startsWith("http") || id.startsWith("blob:")) return undefined;
  return widths.map((w) => `${img(id, w)} ${w}w`).join(", ");
}

/**
 * Hero frame n (1-based). All 120 frames load for the scroll animation, so delivery uses
 * Cloudinary's eco quality (about half the bytes of q_auto:best) plus a light sharpen for the soft video source.
 * Falls back to /hero-frames when Cloudinary is switched off.
 */
export function heroFrame(n: number, width: number): string {
  const id = String(n).padStart(3, "0");
  if (!useCloudinary) return `/hero-frames/frame_${id}.webp`;
  return `${base}/f_auto,q_auto:eco,e_sharpen:60,c_limit,w_${width}/gruham/hero/frame_${id}`;
}

export const brandMark = (size = 96) => `${base}/f_auto,q_auto,w_${size * 2}/gruham/catalog/brand-mark`;

/** Product-quality images in gruham/catalog, offered in admin image pickers. */
export const CATALOG_IMAGES = [
  "halfsaree-rust-maroon", "halfsaree-kalamkari-rani", "halfsaree-lavender-peacock", "halfsaree-kalamkari-navy",
  "saree-banarasi-violet", "saree-banarasi-violet-detail", "saree-banarasi-red-pallu", "saree-ivory-tissue", "saree-soft-silk-mustard", "saree-sambalpuri-red",
  "jewel-bridal-set", "jewel-temple-necklace", "jewel-kemp-necklace", "jewel-spike-necklace", "jewel-layered-haar", "jewel-coin-mala",
  "jewel-chain-pendant", "jewel-lotus-pendant", "jewel-emerald-beads", "jewel-gold-earrings", "jewel-enamel-bangle",
];
