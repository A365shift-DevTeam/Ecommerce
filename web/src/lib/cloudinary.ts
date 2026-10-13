const cloud = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dghhdz3et";
const useCloudinary = import.meta.env.VITE_USE_CLOUDINARY !== "false";
const base = `https://res.cloudinary.com/${cloud}/image/upload`;

export const HERO_FRAME_COUNT = 120;

/** Catalogue image by id. Data URLs and absolute URLs (admin uploads) pass through untouched. */
export function img(id: string, width = 800): string {
  if (id.startsWith("data:") || id.startsWith("http") || id.startsWith("blob:")) return id;
  return `${base}/f_auto,q_auto:best,c_limit,w_${width}/gruham/catalog/${id}`;
}

export function srcSet(id: string, widths = [480, 720, 1000, 1400, 1800]): string | undefined {
  if (id.startsWith("data:") || id.startsWith("http") || id.startsWith("blob:")) return undefined;
  return widths.map((w) => `${img(id, w)} ${w}w`).join(", ");
}

/**
 * Hero frame n (1-based). The source frames are soft (extracted from video), so delivery uses
 * Cloudinary's best automatic quality plus a light sharpen instead of the default compression.
 * Falls back to /hero-frames when Cloudinary is switched off.
 */
export function heroFrame(n: number, width: number): string {
  const id = String(n).padStart(3, "0");
  if (!useCloudinary) return `/hero-frames/frame_${id}.webp`;
  return `${base}/f_auto,q_auto:best,e_sharpen:60,c_limit,w_${width}/gruham/hero/frame_${id}`;
}

export const brandMark = (size = 96) => `${base}/f_auto,q_auto,w_${size * 2}/gruham/catalog/brand-mark`;

/** Product-quality images in gruham/catalog, offered in admin image pickers. */
export const CATALOG_IMAGES = [
  "halfsaree-rust-maroon", "halfsaree-kalamkari-rani", "halfsaree-lavender-peacock", "halfsaree-kalamkari-navy",
  "saree-banarasi-violet", "saree-banarasi-violet-detail", "saree-banarasi-red-pallu", "saree-ivory-tissue", "saree-soft-silk-mustard", "saree-sambalpuri-red",
  "jewel-bridal-set", "jewel-temple-necklace", "jewel-kemp-necklace", "jewel-spike-necklace", "jewel-layered-haar", "jewel-coin-mala",
  "jewel-chain-pendant", "jewel-lotus-pendant", "jewel-emerald-beads", "jewel-gold-earrings", "jewel-enamel-bangle",
];
