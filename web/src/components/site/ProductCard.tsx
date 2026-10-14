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
      {/* Image in a gold hairline frame that brightens on hover */}
      <div className="relative overflow-hidden rounded-[2px] border border-hair bg-paper transition-colors duration-500 group-hover/card:border-brand/60">
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
          <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-page/70 to-transparent" />
        </Link>

        {/* Badges */}
        <div className="pointer-events-none absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
          {out ? (
            <Badge tone="dark">Sold out</Badge>
          ) : (
            <>
              {off > 0 && <Badge tone="brand">{off}% off</Badge>}
              {product.isNew && <Badge>New</Badge>}
              {product.bestseller && !product.isNew && <Badge tone="gold">Bestseller</Badge>}
            </>
          )}
        </div>

        <button
          onClick={() => toggleWishlist(product.id)}
          aria-pressed={wished}
          aria-label={wished ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          className="absolute right-2.5 top-2.5 grid size-10 place-items-center rounded-full border border-hair-2 bg-page/70 text-fg backdrop-blur-sm transition-[transform,color,border-color] hover:scale-105 hover:border-brand hover:text-brand active:scale-90"
        >
          <Heart size={18} weight={wished ? "fill" : "light"} className={wished ? "text-brand" : ""} />
        </button>

        {/* Quick add: full-width bar on hover (desktop), round button (touch) */}
        {!out && (
          <>
            <button
              onClick={() => addToCart(product.id)}
              className="absolute inset-x-2.5 bottom-2.5 hidden min-h-11 translate-y-2 items-center justify-center gap-2.5 rounded-[2px] border border-brand bg-page/90 text-[0.68rem] font-medium uppercase tracking-[0.2em] text-fg opacity-0 backdrop-blur-sm transition-all duration-300 hover:bg-brand hover:text-on-brand focus-visible:translate-y-0 focus-visible:opacity-100 group-hover/card:translate-y-0 group-hover/card:opacity-100 lg:flex"
            >
              <ShoppingBag size={15} /> Add to bag
            </button>
            <button
              onClick={() => addToCart(product.id)}
              aria-label={`Add ${product.name} to bag`}
              className="gold-fill absolute bottom-2.5 right-2.5 grid size-10 place-items-center rounded-full text-on-brand shadow-[0_4px_14px_rgba(0,0,0,0.4)] active:scale-90 lg:hidden"
            >
              <ShoppingBag size={17} />
            </button>
          </>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 pt-4">
        <p className="text-[0.62rem] font-medium uppercase tracking-[0.22em] text-brand">{product.fabric}</p>
        <h3 className="line-clamp-2 font-display text-[1.02rem] leading-snug text-fg sm:text-[1.1rem]">
          <Link to={`/product/${product.slug}`} className="transition-colors hover:text-gold-light">
            {product.name}
          </Link>
        </h3>
        {product.reviews > 0 && <Stars rating={product.rating} reviews={product.reviews} size={12} />}
        <div className="mt-auto pt-1">
          <Price mrp={product.mrp} sale={product.salePrice} />
          {low && <p className="mt-1 text-[0.72rem] font-medium text-error">Only {product.stock} left</p>}
        </div>
      </div>
    </article>
  );
}
