import { useEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";
import { HERO_FRAME_COUNT, HERO_WIDTHS, heroFrame, heroIntro } from "../../lib/cloudinary";
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
  - Section pins the full viewport; the frame fills everything below the announcement bar edge to edge
    (centre crop of whatever does not fit the screen's shape).
  - The header's main row is see-through over the frame until the frames finish (Header.tsx).
  Page content after the hero only scrolls once all frames have played.

  Speed: frames are fetched and decoded off the main thread (createImageBitmap) at roughly the size
  they are drawn, and kept as decoded bitmaps. An earlier version pre-rendered every frame into its own
  full-size canvas, which blocked the main thread for about 7 s while the 120 frames loaded.
  Smoothness: Lenis smooths the scroll; a scroll tick is one drawImage of an already decoded bitmap.
  Each scroll position shows exactly one frame: no blending between frames (that read as motion blur).
  Intro: the Gruham brand card is the opening frame. It fades into frame 1 over the first INTRO_FADE
  of the scroll, then the frames play. On desktop it sits below the see-through nav row, so the nav
  never covers its "GRUHAM" title; the strip behind the nav is filled with the card's velvet colour.
*/

const FRAME_STEP = 1; // all 120 frames, so each step between frames is small
const INTRO_FADE = 0.06; // share of the pinned scroll spent fading the brand card into frame 1
const INTRO_BG = "#411211"; // velvet along the card's top edge
// Per-frame width caps: keeps 120 decoded frames within phone and laptop memory.
const backingCap = (mobile: boolean) => (mobile ? 720 : 1440);

function sourceWidth(cssWidth: number, mobile: boolean) {
  const need = Math.min(cssWidth * Math.min(window.devicePixelRatio || 1, 2), backingCap(mobile));
  return HERO_WIDTHS.find((w) => w >= need) ?? HERO_WIDTHS[HERO_WIDTHS.length - 1];
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

type Frame = ImageBitmap | HTMLImageElement;

const frameSize = (f: Frame) => (f instanceof HTMLImageElement ? [f.naturalWidth, f.naturalHeight] : [f.width, f.height]);

function release(frames: (Frame | null)[]) {
  for (const f of frames) if (f && !(f instanceof HTMLImageElement)) f.close();
}

/** Download and decode one frame off the main thread; falls back to <img> where createImageBitmap is missing. */
async function loadFrame(url: string): Promise<Frame | null> {
  if (typeof createImageBitmap === "function") {
    try {
      const res = await fetch(url);
      if (res.ok) return await createImageBitmap(await res.blob());
    } catch {
      // fall through to <img>
    }
  }
  const im = new Image();
  im.decoding = "async";
  im.src = url;
  try {
    await im.decode();
  } catch {
    return im.naturalWidth ? im : null;
  }
  return im;
}

/** Source rectangle that centre-crops an fw×fh image to the w:h shape. */
function cropTo(fw: number, fh: number, w: number, h: number) {
  const k = Math.max(w / fw, h / fh);
  const sw = w / k;
  const sh = h / k;
  return [(fw - sw) / 2, (fh - sh) / 2, sw, sh] as const;
}

/**
 * cover: desktop fills the box edge to edge (centre crop); otherwise the frame is drawn whole.
 * introTop: canvas rows hidden behind the see-through nav row, which the brand card stays below.
 */
type Rect = { cw: number; ch: number; x: number; y: number; w: number; h: number; cover: boolean; introTop: number };

export function HeroScroll({ mobileContent }: { mobileContent?: ReactNode }) {
  const reduced = useReducedMotion();
  const mobile = useIsMobile();
  const sectionRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const urlsRef = useRef<string[]>([]);
  const cacheRef = useRef<(Frame | null)[]>([]);
  const introRef = useRef<Frame | null>(null);
  const navRowRef = useRef<HTMLDivElement>(null);
  const rectRef = useRef<Rect | null>(null);
  const geomRef = useRef({ start: 0, travel: 1 });
  const posRef = useRef({ current: 0, drawn: -1, alpha: -1, dirty: true, t: 0 });
  const genRef = useRef(0);
  const introLoadRef = useRef<Promise<unknown>>(Promise.resolve());
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
    if (!box || !canvas) return;
    const scale = Math.min(window.devicePixelRatio || 1, 2, backingCap(mobile) / Math.max(1, box.clientWidth));
    const cw = Math.max(1, Math.round(box.clientWidth * scale));
    const ch = Math.max(1, Math.round(box.clientHeight * scale));
    // Mobile: the box is exactly 16:9, frame drawn whole and top-aligned.
    // Desktop: full screen. The frame covers the whole area under the header (centre crop of the overflow).
    const cover = !mobile;
    const s = cover ? Math.max(cw / 16, ch / 9) : Math.min(cw / 16, ch / 9);
    const w = cover ? cw : Math.round(16 * s);
    const h = cover ? ch : Math.round(9 * s);
    canvas.width = cw;
    canvas.height = ch;
    // Resizing clears an opaque canvas to black; paint the card's velvet until the next draw.
    const ctx = canvas.getContext("2d", { alpha: false });
    if (ctx) (ctx.fillStyle = INTRO_BG), ctx.fillRect(0, 0, cw, ch);
    const introTop = cover ? Math.round((navRowRef.current?.clientHeight ?? 0) * scale) : 0;
    rectRef.current = { cw, ch, w, h, cover, introTop, x: Math.round((cw - w) / 2), y: cover || mobile ? 0 : Math.round((ch - h) / 2) };
    posRef.current.dirty = true;
  };

  /** Draw frame `pos`, with the brand card on top at `introAlpha` (1 = card only, 0 = frame only). */
  const draw = (pos: number, introAlpha: number) => {
    const canvas = canvasRef.current;
    const rect = rectRef.current;
    const cache = cacheRef.current;
    if (!canvas || !rect) return false;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return false;
    const intro = introAlpha > 0 ? introRef.current : null;
    let a: Frame | null = null;
    if (!intro || introAlpha < 1) {
      const i = Math.round(pos);
      a = cache[i] ?? null;
      for (let d = 1; !a && d < cache.length; d++) a = cache[i - d] ?? cache[i + d] ?? null;
    }
    if (!a && !intro) return false;
    ctx.imageSmoothingQuality = "high";
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#1c0b10";
    ctx.fillRect(0, 0, rect.cw, rect.ch);
    if (a) {
      const [fw, fh] = frameSize(a);
      // Desktop crops the centre of the frame to the box's aspect ratio; mobile draws it whole.
      const [sx, sy, sw, sh] = rect.cover ? cropTo(fw, fh, rect.w, rect.h) : [0, 0, fw, fh];
      ctx.drawImage(a, sx, sy, sw, sh, rect.x, rect.y, rect.w, rect.h);
    }
    if (intro) {
      const [fw, fh] = frameSize(intro);
      const top = rect.introTop;
      ctx.globalAlpha = a ? introAlpha : 1;
      ctx.fillStyle = INTRO_BG;
      ctx.fillRect(0, 0, rect.cw, top);
      ctx.drawImage(intro, ...cropTo(fw, fh, rect.cw, rect.ch - top), 0, top, rect.cw, rect.ch - top);
      ctx.globalAlpha = 1;
    }
    return true;
  };
  const drawRef = useRef(draw);
  drawRef.current = draw;

  /** Load one decoded frame into the cache, unless a newer build has replaced this one. */
  const renderFrame = async (i: number, gen: number) => {
    const f = await loadFrame(urlsRef.current[i]);
    if (!f) return;
    if (gen !== genRef.current) return release([f]);
    cacheRef.current[i] = f;
    posRef.current.dirty = true;
    if (i === 0 || (reduced && i === urlsRef.current.length - 1)) setReady(true);
    setLoaded((n) => n + 1);
  };

  /** (Re)build the frame cache: on first load and whenever larger frames are needed. */
  const build = () => {
    const gen = ++genRef.current;
    const n = urlsRef.current.length;
    release(cacheRef.current);
    cacheRef.current = new Array(n).fill(null);
    setLoaded(0);
    const queue = reduced ? [n - 1] : loadOrder(n);
    Array.from({ length: 6 }, async () => {
      await introLoadRef.current; // the brand card shows first, so no showroom frame flashes before it
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
    let alive = true;
    introLoadRef.current = reduced
      ? Promise.resolve()
      : loadFrame(heroIntro(backingCap(mobile))).then((f) => {
          if (!alive) return f && release([f]);
          introRef.current = f;
          posRef.current.dirty = true;
          if (f) setReady(true);
        });
    let width = 0;
    // Frames are scaled on every draw, so a resize only reloads when it needs larger frames.
    const load = () => {
      const coverWidth = mobile ? box.clientWidth : Math.max(box.clientWidth, (box.clientHeight * 16) / 9);
      const w = sourceWidth(coverWidth, mobile);
      if (w <= width) return;
      width = w;
      urlsRef.current = list.map((n) => heroFrame(n, w));
      build();
    };
    layout();
    load();
    measure();
    let t = 0;
    const ro = new ResizeObserver(() => {
      clearTimeout(t);
      t = window.setTimeout(() => {
        layout();
        load();
        measure();
      }, 150);
    });
    ro.observe(box);
    if (sectionRef.current) ro.observe(sectionRef.current);
    return () => {
      ro.disconnect();
      clearTimeout(t);
      genRef.current++;
      alive = false;
      release(cacheRef.current);
      cacheRef.current = [];
      if (introRef.current) release([introRef.current]);
      introRef.current = null;
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
        // The brand card fades out over the first INTRO_FADE of the scroll (in 1/32 steps, so idle ticks don't redraw),
        // then the frames play over the rest.
        const alpha = reduced ? 0 : Math.round((1 - Math.min(1, p / INTRO_FADE)) * 32) / 32;
        const fp = reduced ? 1 : Math.max(0, (p - INTRO_FADE) / (1 - INTRO_FADE));
        // Lenis already smooths the scroll, so the frame follows it directly: one whole frame per position.
        const shown = Math.round(fp * (n - 1));
        const pos = posRef.current;
        if (pos.dirty || shown !== pos.drawn || alpha !== pos.alpha) {
          if (drawRef.current(shown, alpha)) {
            pos.drawn = shown;
            pos.alpha = alpha;
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
      {/* Placeholder until the canvas has something to draw, placed exactly where the canvas will put it. */}
      {reduced ? (
        <img
          src={heroFrame(HERO_FRAME_COUNT, 960)}
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          className={`absolute inset-0 size-full ${mobile ? "object-contain object-top" : "object-cover"} transition-opacity duration-500 ${ready ? "opacity-0" : "opacity-100"}`}
        />
      ) : (
        <div aria-hidden="true" className={`absolute inset-0 transition-opacity duration-500 ${ready ? "opacity-0" : "opacity-100"}`} style={{ background: INTRO_BG }}>
          <img src={heroIntro(backingCap(mobile))} alt="" fetchPriority="high" className={`absolute inset-x-0 bottom-0 w-full object-cover ${mobile ? "h-full" : "h-[calc(100%-var(--main-nav-height))]"}`} />
        </div>
      )}
      {/* Measures the see-through nav row on desktop, which the brand card stays below. */}
      <div ref={navRowRef} aria-hidden="true" className="pointer-events-none invisible absolute inset-x-0 top-0 h-[var(--main-nav-height)]" />
      <canvas
        ref={canvasRef}
        data-hero-canvas
        // Hidden until it has drawn: an opaque canvas is black before its first draw and would cover the placeholder.
        className={`absolute inset-0 size-full ${ready ? "" : "opacity-0"}`}
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
        {/* Starts under the announcement bar: the header's main row is see-through while the frames play. */}
        <div ref={boxRef} className="absolute inset-x-0 bottom-0 top-[var(--announce-height)]">
          {frame}
        </div>
      </div>
      <div id="hero-end" className="absolute bottom-0 h-px w-full" aria-hidden="true" />
    </section>
  );
}
