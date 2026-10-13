import Lenis from "lenis";
import "lenis/dist/lenis.css";

/*
  One Lenis instance for the storefront. It smooths wheel and trackpad input so scroll-driven
  pieces (the hero frames) move continuously instead of jumping in wheel-sized steps.
  Skipped entirely when the visitor asks for reduced motion. Touch scrolling stays native.
*/
let lenis: Lenis | null = null;
let rafId = 0;

export function startSmoothScroll() {
  if (lenis || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, smoothWheel: true });
  const raf = (t: number) => {
    lenis?.raf(t);
    rafId = requestAnimationFrame(raf);
  };
  rafId = requestAnimationFrame(raf);
}

export function stopSmoothScroll() {
  cancelAnimationFrame(rafId);
  lenis?.destroy();
  lenis = null;
}

/** Jump to the top without animating (route changes). */
export function resetScroll() {
  if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
  else window.scrollTo(0, 0);
}

/** Freeze page scrolling while an overlay (menu, search, zoom) is open. */
export function lockScroll(locked: boolean) {
  document.body.style.overflow = locked ? "hidden" : "";
  if (!lenis) return;
  if (locked) lenis.stop();
  else lenis.start();
}
