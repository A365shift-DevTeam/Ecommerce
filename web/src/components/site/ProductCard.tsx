import { Link } from "react-router-dom";
import { Heart, ShoppingBag } from "@phosphor-icons/react";
import type { Product } from "../../data/types";
import { img, srcSet } from "../../lib/cloudinary";
import { discountPct } from "../../lib/format";
import { useStore } from "../../store/useStore";
import { Badge, Price, Stars } from "./ui";

export function ProductCard({ product, sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw", eager = false }: { product: Product; sizes?: string; eager?: boolean }) {
  const wished = useStore((s) => s.wishlist.includes(product.id));
  const toggleWishlist = useStore((s) => s.toggleWishlist);
  const addToCart = useStore((s) => s.addToCart);
  const [first, second] = product.images;
  const out = product.stock === 0;
  const low = !out && product.stock <= 3;
  const off = discountPct(product.mrp, product.salePrice);

  return (
    <article className="group/card relative flex flex-col">
      <div className="relative overflow-hidden rounded-lg bg-paper">
        <Link to={`/product/${product.slug}`} className="block aspect-[3/4]" aria-label={product.name}>
          <img
            src={img(first, 640)}
            srcSet={srcSet(first)}
            sizes={sizes}
            alt=""
            loading={eager ? "eager" : "lazy"}
            className={`size-full object-cover object-[center_35%] transition-[transform,opacity] duration-700 ease-[var(--ease-out-soft)] ${second ? "group-hover/card:opacity-0" : "group-hover/card:scale-[1.04]"} ${out ? "opacity-50 grayscale" : ""}`}
          />
          {second && (
            <img
              src={img(second, 640)}
              srcSet={srcSet(second)}
              sizes={sizes}
              alt=""
              loading="lazy"
              className="absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-700 group-hover/card:opacity-100"
            />
          )}
        </Link>

        {/* Badges */}
        <div className="pointer-events-none absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
          {out ? (
            <Badge tone="dark">Sold out</Badge>
          ) : (
            <>
              {off > 0 && <Badge tone="brand">{off}% OFF</Badge>}
              {product.isNew && <Badge>NEW</Badge>}
              {product.bestseller && !product.isNew && <Badge tone="gold">BESTSELLER</Badge>}
            </>
          )}
        </div>

        <button
          onClick={() => toggleWishlist(product.id)}
          aria-pressed={wished}
          aria-label={wished ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          className="absolute right-2.5 top-2.5 grid size-10 place-items-center rounded-full bg-page/95 text-fg shadow-[0_1px_4px_rgba(36,22,25,0.12)] transition-transform hover:scale-105 active:scale-90"
        >
          <Heart size={18} weight={wished ? "fill" : "regular"} className={wished ? "text-brand" : ""} />
        </button>

        {/* Quick add: full-width bar on hover (desktop), round button (touch) */}
        {!out && (
          <>
            <button
              onClick={() => addToCart(product.id)}
              className="absolute inset-x-2.5 bottom-2.5 hidden min-h-11 translate-y-2 items-center justify-center gap-2 rounded-lg bg-page/95 text-[0.85rem] font-semibold text-fg opacity-0 shadow-[0_2px_8px_rgba(36,22,25,0.15)] transition-all duration-300 hover:bg-brand hover:text-white focus-visible:translate-y-0 focus-visible:opacity-100 group-hover/card:translate-y-0 group-hover/card:opacity-100 lg:flex"
            >
              <ShoppingBag size={16} /> Add to bag
            </button>
            <button
              onClick={() => addToCart(product.id)}
              aria-label={`Add ${product.name} to bag`}
              className="absolute bottom-2.5 right-2.5 grid size-10 place-items-center rounded-full bg-brand text-white shadow-[0_2px_6px_rgba(36,22,25,0.25)] active:scale-90 lg:hidden"
            >
              <ShoppingBag size={17} />
            </button>
          </>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 pt-3">
        <p className="text-[0.75rem] text-fg-3">{product.fabric}</p>
        <h3 className="line-clamp-2 text-[0.92rem] font-medium leading-snug text-fg">
          <Link to={`/product/${product.slug}`} className="hover:underline hover:underline-offset-2">
            {product.name}
          </Link>
        </h3>
        {product.reviews > 0 && <Stars rating={product.rating} reviews={product.reviews} size={12} />}
        <div className="mt-auto pt-1">
          <Price mrp={product.mrp} sale={product.salePrice} />
          {low && <p className="mt-0.5 text-[0.78rem] font-medium text-error">Only {product.stock} left</p>}
        </div>
      </div>
    </article>
  );
}
