# Gruham storefront and admin (frontend demo)

Vite + React + TypeScript + Tailwind v4. Frontend only: all data lives in the browser (localStorage), so the demo needs no backend.

## Run

```bash
cd web
npm install
npm run dev        # http://localhost:5173 (Vite default port)
npm run build      # production build in web/dist
```

Environment comes from `../.env.local` (the project root). Only `VITE_*` values reach the browser; the Cloudinary API secret is read by the Node scripts only.

## What's where

| URL | What it is |
| --- | --- |
| `/` | Home: scroll-driven showroom hero, categories, occasions, collections, offer banner, bestsellers, new arrivals |
| `/shop` | Listing with search, category navigation, price / colour / fabric filters and sorting |
| `/product/:slug` | Gallery with hover zoom and full-screen zoom, pricing, stock, delivery-date check, related products |
| `/cart`, `/checkout` | Quantities, coupons, address, demo payment, order confirmation |
| `/account` | Sign in / register, profile, addresses, orders with tracking, wishlist, recently viewed |
| `/admin` | Separate admin app: dashboard, products, orders, catalog & inventory, customers, promotions, reports |

Demo shopper: `meenakshi.raghavan@gmail.com` / `gruham123` (also offered as a one-click fill on the sign-in page).
Admin → "Reset demo data" restores the starting catalogue, orders and customers.

## Hero frames

120 frames (16:9, 4K source) live in Cloudinary at `gruham/hero/frame_001` to `frame_120`, delivered at Cloudinary's eco automatic quality with a light sharpen (catalogue images use standard `q_auto`) to keep page weight down.
They are drawn on a canvas with "contain" sizing: never cropped, zoomed, blurred or covered with text.
Wide screens pin the frame full-screen while you scroll. Phones and portrait tablets pin a full-width 16:9 band under the header while the first shop sections scroll beneath it.
The source frames were extracted from a video, so they cannot be sharper than that video. For crisper frames, re-export them from the original high-resolution render and rerun `npm run upload:frames -- --force`.

## Scripts

- `npm run upload:frames`: uploads `../converted/*.webp` to `gruham/hero` (skips frames already uploaded; `--force` to overwrite).
- `npm run prepare:images`: builds the 4:5 catalogue images and uploads them to `gruham/catalog`.
- `node scripts/organize-cloudinary-folders.mjs`: puts uploaded assets into Media Library folders (needed on dynamic-folder accounts).

## Product imagery

- Half sarees: the client's own photos, uploaded at full resolution (`halfsaree-*` in `gruham/catalog`).
- Banarasi, tissue, soft silk, handloom sarees and all jewellery: CC0 / public-domain museum photographs from Wikimedia Commons (sources in `scripts/sources.json`). These are placeholders until the client's own product photos arrive.

No product uses the showroom frames. Swap any image in Admin → Products, or upload new ones with `node scripts/upload-new-images.mjs` as a template.
