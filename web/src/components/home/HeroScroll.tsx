import { useEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";
import { HERO_FRAME_COUNT, heroFrame } from "../../lib/cloudinary";
import { useIsMobile } from "../../hooks/useIsMobile";

/*
  Scroll-scrubbed walk through the showroom. No text over the frames.

  MOBILE (<= 1024px):
  - Section is 300vh with top padding = header height; the sticky wrapper sits at
    top: var(--nav-height), so the frames touch the bottom of the header with no gap.
  - Canvas is full width at exactly 16:9 (height = 100vw * 9/16), drawn whole ("contain").
  - `mobileContent` renders inside the sticky wrapper, directly under the frames,
    so there is no empty space while the frames play.
  DESKTOP (> 1024px):
  - Section pins the full viewport; the frame fills the whole area under the header edge to edge
    (centre crop of whatever does not fit the screen's shape).
  Page content after the hero only scrolls once all frames have played.

  Smoothness: Lenis smooths the scroll; all 120 frames are pre-rendered once at their exact
  on-screen size, so a scroll tick is a single 1:1 copy with no decoding or resampling.
  Each scroll position shows exactly one frame: no blending between frames (that read as motion blur).
*/

const FRAME_STEP = 1; // all 120 frames, so each step between frames is small
// Per-frame cache width caps: keeps 120 cached frames within phone and laptop memory.
const backingCap = (mobile: boolean) => (mobile ? 720 : 1440);

function sourceWidth(cssWidth: number, mobile: boolean) {
  const need = Math.min(cssWidth * Math.min(window.devicePixelRatio || 1, 2), backingCap(mobile));
  return [960, 1280, 1600, 1920].find((w) => w >= need) ?? 1920;
}

/** Coarse-to-fine load order: every 8th frame first, then 4th, 2nd, then the rest. */
function loadOrder(n: number) {
  const seen = new Set<number>();
  const order: number[] = [];
  for (const step of [8, 4, 2, 1]) {
    for (let i = 0; i < n; i += step) if (!seen.has(i)) (seen.add(i), order.push(i));
    if (!seen.has(n - 1)) (seen.add(n - 1), order.push(n - 1));
  }
  return order;
}

/** cover: desktop fills the box edge to edge (centre crop); otherwise the frame is drawn whole. */
type Rect = { cw: number; ch: number; x: number; y: number; w: number; h: number; cover: boolean };

export function HeroScroll({ mobileContent }: { mobileContent?: ReactNode }) {
  const reduced = useReducedMotion();
  const mobile = useIsMobile();
  const sectionRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const urlsRef = useRef<string[]>([]);
  const cacheRef = useRef<(HTMLCanvasElement | null)[]>([]);
  const rectRef = useRef<Rect | null>(null);
  const geomRef = useRef({ start: 0, travel: 1 });
  const posRef = useRef({ current: 0, drawn: -1, dirty: true, t: 0 });
  const genRef = useRef(0);
  const [ready, setReady] = useState(false);
  const [loaded, setLoaded] = useState(0);

  /** Scroll range over which the hero stays pinned (cached; never read during scroll). */
  const measure = () => {
    const sec = sectionRef.current;
    const sticky = stickyRef.current;
    if (!sec || !sticky) return;
    const r = sec.getBoundingClientRect();
    const pinTop = parseFloat(getComputedStyle(sticky).top) || 0;
    const start = r.top + window.scrollY + sticky.offsetTop - pinTop;
    geomRef.current = { start, travel: Math.max(1, sec.offsetHeight - sticky.offsetTop - sticky.offsetHeight) };
  };

  /** Size the canvas and work out where the 16:9 frame sits inside it (contain). */
  const layout = () => {
    const box = boxRef.current;
    const canvas = canvasRef.current;
    if (!box || !canvas) return false;
    const scale = Math.min(window.devicePixelRatio || 1, 2, backingCap(mobile) / Math.max(1, box.clientWidth));
    const cw = Math.max(1, Math.round(box.clientWidth * scale));
    const ch = Math.max(1, Math.round(box.clientHeight * scale));
    // Mobile: the box is exactly 16:9, frame drawn whole and top-aligned.
    // Desktop: full screen. The frame covers the whole area under the header (centre crop of the overflow).
    const cover = !mobile;
    const s = cover ? Math.max(cw / 16, ch / 9) : Math.min(cw / 16, ch / 9);
    const w = cover ? cw : Math.round(16 * s);
    const h = cover ? ch : Math.round(9 * s);
    const next = { cw, ch, w, h, cover, x: Math.round((cw - w) / 2), y: cover || mobile ? 0 : Math.round((ch - h) / 2) };
    const prev = rectRef.current;
    const changed = !prev || prev.w !== w || prev.h !== h;
    canvas.width = cw;
    canvas.height = ch;
    rectRef.current = next;
    posRef.current.dirty = true;
    return changed;
  };

  const draw = (pos: number) => {
    const canvas = canvasRef.current;
    const rect = rectRef.current;
    const cache = cacheRef.current;
    if (!canvas || !rect || cache.length === 0) return false;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return false;
    const i = Math.round(pos);
    let a = cache[i];
    for (let d = 1; !a && d < cache.length; d++) a = cache[i - d] ?? cache[i + d] ?? null;
    if (!a) return false;
    ctx.fillStyle = "#1c0b10";
    ctx.fillRect(0, 0, rect.cw, rect.ch);
    ctx.drawImage(a, rect.x, rect.y);
    return true;
  };
  const drawRef = useRef(draw);
  drawRef.current = draw;

  /** Load one frame and pre-render it at the exact draw size. */
  const renderFrame = (i: number, gen: number) =>
    new Promise<void>((resolve) => {
      const im = new Image();
      im.decoding = "async";
      im.src = urlsRef.current[i];
      const done = () => {
        const rect = rectRef.current;
        if (gen !== genRef.current || !rect || !im.naturalWidth) return resolve();
        const c = document.createElement("canvas");
        c.width = rect.w;
        c.height = rect.h;
        const cx = c.getContext("2d", { alpha: false })!;
        cx.imageSmoothingEnabled = true;
        cx.imageSmoothingQuality = "high";
        if (rect.cover) {
          // Crop the centre of the frame to the box's aspect ratio, then scale to fit exactly.
          const k = Math.max(rect.w / im.naturalWidth, rect.h / im.naturalHeight);
          const sw = rect.w / k;
          const sh = rect.h / k;
          cx.drawImage(im, (im.naturalWidth - sw) / 2, (im.naturalHeight - sh) / 2, sw, sh, 0, 0, rect.w, rect.h);
        } else {
          cx.drawImage(im, 0, 0, rect.w, rect.h);
        }
        cacheRef.current[i] = c;
        posRef.current.dirty = true;
        if (i === 0 || (reduced && i === urlsRef.current.length - 1)) setReady(true);
        setLoaded((n) => n + 1);
        resolve();
      };
      im.decode().then(done, () => {
        im.onload = done;
        im.onerror = () => resolve();
        if (im.complete) done();
      });
    });

  /** (Re)build the frame cache: on first load and whenever the frame's on-screen size changes. */
  const build = () => {
    const gen = ++genRef.current;
    const n = urlsRef.current.length;
    if (cacheRef.current.length !== n) cacheRef.current = new Array(n).fill(null);
    setLoaded(0);
    const queue = reduced ? [n - 1] : loadOrder(n);
    Array.from({ length: 6 }, async () => {
      while (queue.length && gen === genRef.current) await renderFrame(queue.shift()!, gen);
    });
  };

  // Frame list, canvas size and cache. Re-runs when switching between mobile and desktop.
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const list: number[] = [];
    for (let n = 1; n <= HERO_FRAME_COUNT; n += FRAME_STEP) list.push(n);
    if (list[list.length - 1] !== HERO_FRAME_COUNT) list.push(HERO_FRAME_COUNT);
    const coverWidth = mobile ? box.clientWidth : Math.max(box.clientWidth, (box.clientHeight * 16) / 9);
    urlsRef.current = list.map((n) => heroFrame(n, sourceWidth(coverWidth, mobile)));
    cacheRef.current = new Array(list.length).fill(null);
    rectRef.current = null;
    layout();
    build();
    measure();
    let t = 0;
    const ro = new ResizeObserver(() => {
      clearTimeout(t);
      t = window.setTimeout(() => {
        if (layout()) build();
        measure();
      }, 150);
    });
    ro.observe(box);
    if (sectionRef.current) ro.observe(sectionRef.current);
    return () => {
      ro.disconnect();
      clearTimeout(t);
      genRef.current++;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, mobile]);

  // Render loop: runs only while the hero is on screen.
  useEffect(() => {
    const sec = sectionRef.current;
    if (!sec) return;
    let raf = 0;
    let running = false;
    const tick = () => {
      const n = urlsRef.current.length;
      if (n > 0) {
        const { start, travel } = geomRef.current;
        const p = reduced ? 1 : Math.min(1, Math.max(0, (window.scrollY - start) / travel));
        // Lenis already smooths the scroll, so the frame follows it directly: one whole frame per position.
        const shown = Math.round(p * (n - 1));
        const pos = posRef.current;
        if (pos.dirty || shown !== pos.drawn) {
          if (drawRef.current(shown)) {
            pos.drawn = shown;
            pos.dirty = false;
          }
        }
      }
      if (running) raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !running) {
        running = true;
        measure();
        raf = requestAnimationFrame(tick);
      } else if (!e.isIntersecting) {
        running = false;
        cancelAnimationFrame(raf);
      }
    });
    io.observe(sec);
    window.addEventListener("resize", measure);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [reduced, mobile]);

  const total = reduced ? 1 : Math.ceil(HERO_FRAME_COUNT / FRAME_STEP);
  const pct = Math.min(100, Math.round((loaded / total) * 100));

  const frame = (
    <>
      <img
        src={heroFrame(reduced ? HERO_FRAME_COUNT : 1, 960)}
        alt=""
        aria-hidden="true"
        fetchPriority="high"
        className={`absolute inset-0 size-full ${mobile ? "object-contain object-top" : "object-cover"} transition-opacity duration-500 ${ready ? "opacity-0" : "opacity-100"}`}
      />
      <canvas
        ref={canvasRef}
        data-hero-canvas
        className="absolute inset-0 size-full"
        role="img"
        aria-label="A walk through the Gruham showroom, from the entrance past draped mannequins to a bride in a red Kanjivaram."
      />
      {/* Loading progress: a small ring in the corner, gone once every frame is ready. */}
      <div
        role="progressbar"
        aria-label="Loading the showroom walk-through"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        className={`pointer-events-none absolute bottom-3 right-3 grid size-11 place-items-center rounded-full bg-velvet/70 backdrop-blur-sm transition-opacity duration-500 ${pct >= 100 ? "opacity-0" : "opacity-100"}`}
      >
        <svg viewBox="0 0 36 36" className="absolute inset-0 size-full -rotate-90" aria-hidden="true">
          <circle cx="18" cy="18" r="15" fill="none" stroke="rgb(239 230 218 / 0.15)" strokeWidth="2.5" />
          <circle cx="18" cy="18" r="15" fill="none" stroke="var(--color-bronze)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray={`${(pct / 100) * 94.25} 94.25`} />
        </svg>
        <span className="text-[0.62rem] font-semibold tabular text-ivory">{pct}%</span>
      </div>
    </>
  );

  if (mobile) {
    return (
      <section
        ref={sectionRef}
        id="story"
        aria-label="Inside the Gruham studio"
        className={`relative bg-page pt-[var(--nav-height)] ${reduced ? "" : "h-[300vh]"}`}
      >
        <div ref={stickyRef} className="sticky top-[var(--nav-height)] flex h-[calc(100svh-var(--nav-height))] flex-col overflow-hidden">
          <div ref={boxRef} className="relative aspect-video w-full shrink-0">
            {frame}
          </div>
          {mobileContent && <div className="min-h-0 flex-1 overflow-hidden">{mobileContent}</div>}
        </div>
        <div id="hero-end" className="absolute bottom-0 h-px w-full" aria-hidden="true" />
      </section>
    );
  }

  return (
    <section ref={sectionRef} aria-label="Inside the Gruham studio" className={reduced ? "relative h-[100svh]" : "relative h-[420vh]"}>
      <div ref={stickyRef} className="sticky top-0 h-[100svh] overflow-hidden bg-velvet">
        <div ref={boxRef} className="absolute inset-x-0 bottom-0 top-[var(--nav-height)]">
          {frame}
        </div>
      </div>
      <div id="hero-end" className="absolute bottom-0 h-px w-full" aria-hidden="true" />
    </section>
  );
}
