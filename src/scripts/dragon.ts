// Procedural sky-serpent.
//
// Layout pass  : measure the real cards, weave a Catmull-Rom spline between
//                them, and sample it at even arc-length steps.
// Frame pass   : offset the cached samples along their normals with a travelling
//                sine wave, then rebuild the tapered outline, the dorsal fins
//                and the head transform.
//
// Splitting it this way keeps the expensive DOM measurement out of the frame
// loop — per frame we only touch cached numbers and write a handful of
// attributes.

const NS = 'http://www.w3.org/2000/svg';

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

/** Sample count along the spine. Enough for a smooth silhouette, cheap enough to rebuild each frame. */
const SAMPLES = 260;
/** Fraction of the body (from the head) that is drawn on the front layer. */
const FRONT_FRACTION = 0.07;
const FIN_COUNT = 34;
/** How far the spine overlaps a card's edge, so it reads as passing behind it. */
const CARD_OVERLAP = 12;
const EDGE_MARGIN = 14;
/** Cards whose vertical bands overlap by more than this are treated as one row. */
const ROW_TOLERANCE = 24;
/** Undulation: full sine cycles over the whole body, and its amplitude in px. */
const WAVES = 3.5;
const WAVE_AMPLITUDE = 9;
const WAVE_SPEED = 0.0011; // radians per ms

type Pt = { x: number; y: number };
type Row = { left: number; right: number; top: number; bottom: number };

let base: Pt[] = [];
let normals: Pt[] = [];
let tangents: Pt[] = [];
let maxHalf = 15;
let headScale = 1;
let docWidth = 0;
let rafId = 0;
let lastFrame = 0;
let relayoutTimer = 0;

function el<T extends Element>(sel: string): T | null {
  return document.querySelector<T>(sel);
}

/* ------------------------------------------------------------------ *
 * Geometry
 * ------------------------------------------------------------------ */

/**
 * Collapse the cards into horizontal bands. A two-column section or a grid of
 * project cards becomes a single row, so the serpent treats it as one obstacle
 * instead of doubling back through it.
 */
function collectRows(): Row[] {
  const sx = window.scrollX;
  const sy = window.scrollY;

  const rects = Array.from(document.querySelectorAll<HTMLElement>('main .panel, main .project-card'))
    .map((node) => node.getBoundingClientRect())
    .filter((r) => r.width > 180 && r.height > 70)
    .map((r) => ({ left: r.left + sx, right: r.right + sx, top: r.top + sy, bottom: r.bottom + sy }))
    .sort((a, b) => a.top - b.top);

  const rows: Row[] = [];
  for (const r of rects) {
    const last = rows[rows.length - 1];
    if (last && r.top < last.bottom - ROW_TOLERANCE) {
      last.left = Math.min(last.left, r.left);
      last.right = Math.max(last.right, r.right);
      last.bottom = Math.max(last.bottom, r.bottom);
    } else {
      rows.push({ ...r });
    }
  }
  return rows;
}

/**
 * Thread the spine down the page: it snakes through the gutter beside each row,
 * grazing the card edge so it disappears behind it, and only crosses the full
 * width inside the empty band between two sections — never over live text.
 */
function collectAnchors(): Pt[] {
  const rows = collectRows();
  if (rows.length === 0) return [];

  const pts: Pt[] = [];

  rows.forEach((row, i) => {
    const onLeft = i % 2 === 0;
    const gutter = onLeft ? row.left : docWidth - row.right;
    const amp = Math.min(56, Math.max(14, gutter * 0.5));
    // The line the weave oscillates around, just inside the card's edge.
    const line = onLeft
      ? Math.max(EDGE_MARGIN + amp, row.left + CARD_OVERLAP)
      : Math.min(docWidth - EDGE_MARGIN - amp, row.right - CARD_OVERLAP);
    const out = onLeft ? -1 : 1;
    const h = row.bottom - row.top;

    pts.push({ x: line + out * amp, y: row.top + h * 0.16 });
    pts.push({ x: line - out * amp * 0.55, y: row.top + h * 0.5 });
    pts.push({ x: line + out * amp * 0.85, y: row.top + h * 0.84 });

    const next = rows[i + 1];
    if (next) {
      const mid = (row.bottom + next.top) / 2;
      // Ease out of the gutter before the crossing so the turn is a curve, not a corner.
      if (next.top - row.bottom > 60) {
        pts.push({ x: line + out * amp * 0.25, y: row.bottom + (mid - row.bottom) * 0.5 });
      }
      pts.push({ x: (row.left + row.right) / 2, y: mid });
    }
  });

  // Rear the head up above the first row — but keep it clear of the sticky header.
  const first = pts[0];
  const last = pts[pts.length - 1];
  const headY = Math.max(first.y - 120, 150);
  pts.unshift({ x: first.x, y: (first.y + headY) / 2 });
  pts.unshift({ x: first.x + 46, y: headY });
  pts.push({ x: last.x, y: last.y + 170 });

  return pts;
}

/**
 * Catmull-Rom through every point, emitted as cubic beziers.
 *
 * Centripetal parameterisation (alpha 0.5) rather than uniform: the anchors are
 * deliberately unevenly spaced — short weave steps beside a card, then one long
 * jump across a section gap — and uniform Catmull-Rom answers that with cusps
 * and overshoot. Centripetal is the variant that provably avoids both.
 */
function splinePath(pts: Pt[]): string {
  if (pts.length < 2) return '';
  const alpha = 0.5;
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;

  for (let i = 0; i < pts.length - 1; i += 1) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? pts[i + 1];

    const d1 = Math.pow(Math.hypot(p1.x - p0.x, p1.y - p0.y), alpha) || 1e-4;
    const d2 = Math.pow(Math.hypot(p2.x - p1.x, p2.y - p1.y), alpha) || 1e-4;
    const d3 = Math.pow(Math.hypot(p3.x - p2.x, p3.y - p2.y), alpha) || 1e-4;

    const k1 = 3 * d1 * (d1 + d2);
    const k2 = 3 * d3 * (d3 + d2);
    const w1 = 2 * d1 * d1 + 3 * d1 * d2 + d2 * d2;
    const w2 = 2 * d3 * d3 + 3 * d3 * d2 + d2 * d2;

    const c1x = (d1 * d1 * p2.x - d2 * d2 * p0.x + w1 * p1.x) / k1;
    const c1y = (d1 * d1 * p2.y - d2 * d2 * p0.y + w1 * p1.y) / k1;
    const c2x = (d3 * d3 * p1.x - d2 * d2 * p3.x + w2 * p2.x) / k2;
    const c2y = (d3 * d3 * p1.y - d2 * d2 * p3.y + w2 * p2.y) / k2;

    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

/** Body half-thickness at t (0 = head, 1 = tail tip). */
function halfWidth(t: number): number {
  // Thick behind the head, a gentle neck pinch, then a long taper to a point.
  const taper = Math.pow(1 - t, 0.62);
  const neck = 0.78 + 0.22 * Math.min(1, t * 6);
  return Math.max(0.6, maxHalf * taper * neck);
}

/* ------------------------------------------------------------------ *
 * Layout pass
 * ------------------------------------------------------------------ */

function layout(): boolean {
  const back = el<SVGSVGElement>('#dragon-back');
  const front = el<SVGSVGElement>('#dragon-front');
  const spine = el<SVGPathElement>('#dragon-spine');
  if (!back || !front || !spine) return false;

  // Measure the document with the layers collapsed, otherwise a previously
  // oversized SVG inflates scrollHeight and the layer grows every relayout.
  back.style.height = '0px';
  front.style.height = '0px';

  docWidth = document.documentElement.clientWidth;
  const docHeight = Math.max(
    document.documentElement.scrollHeight,
    document.body.scrollHeight,
  );

  const anchors = collectAnchors();
  if (anchors.length < 3) {
    back.classList.remove('is-ready');
    front.classList.remove('is-ready');
    return false;
  }

  for (const svg of [back, front]) {
    svg.setAttribute('viewBox', `0 0 ${docWidth} ${docHeight}`);
    svg.style.width = `${docWidth}px`;
    svg.style.height = `${docHeight}px`;
  }

  // Scale the creature to the viewport so it stays readable on phones. The head
  // is kept proportional to the body rather than sized independently.
  maxHalf = docWidth < 640 ? 6 : docWidth < 1100 ? 8 : 10;
  headScale = maxHalf / 9;

  spine.setAttribute('d', splinePath(anchors));
  const total = spine.getTotalLength();
  if (!Number.isFinite(total) || total <= 0) return false;

  base = [];
  for (let i = 0; i < SAMPLES; i += 1) {
    const p = spine.getPointAtLength((i / (SAMPLES - 1)) * total);
    base.push({ x: p.x, y: p.y });
  }

  tangents = [];
  normals = [];
  for (let i = 0; i < SAMPLES; i += 1) {
    const a = base[Math.max(0, i - 1)];
    const b = base[Math.min(SAMPLES - 1, i + 1)];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    tangents.push({ x: dx / len, y: dy / len });
    normals.push({ x: -dy / len, y: dx / len });
  }

  // Each layer gets fins in proportion to the stretch of body it draws — giving
  // both the full count would cram FIN_COUNT spikes onto the short neck.
  buildFins(back.querySelector('[data-fins-back]'), Math.round(FIN_COUNT * (1 - FRONT_FRACTION)));
  buildFins(front.querySelector('[data-fins-front]'), Math.max(2, Math.round(FIN_COUNT * FRONT_FRACTION)));

  return true;
}

/** Create (once per layout) the dorsal fin elements a frame pass will position. */
function buildFins(host: Element | null, count: number): void {
  if (!host) return;
  host.textContent = '';
  for (let i = 0; i < count; i += 1) {
    const fin = document.createElementNS(NS, 'path');
    fin.setAttribute('class', 'dragon-fin');
    fin.setAttribute('d', 'M -7 2 L -1 -15 L 3 -13 L 7 2 Z');
    host.appendChild(fin);
  }
}

/* ------------------------------------------------------------------ *
 * Frame pass
 * ------------------------------------------------------------------ */

/** Sine offset applied along the normal at sample i. */
function wobble(i: number, phase: number): number {
  if (reduce.matches) return 0;
  const t = i / (SAMPLES - 1);
  // Almost still at the head, freest at the tail — that is how a snake moves.
  return Math.sin(t * WAVES * Math.PI * 2 - phase) * WAVE_AMPLITUDE * (0.2 + 0.8 * t);
}

function pointAt(i: number, phase: number): Pt {
  const w = wobble(i, phase);
  return {
    x: base[i].x + normals[i].x * w,
    y: base[i].y + normals[i].y * w,
  };
}

/** Tapered outline for samples [from, to] — one side out, the other side back. */
function outline(from: number, to: number, phase: number): string {
  const forward: string[] = [];
  const backward: string[] = [];

  for (let i = from; i <= to; i += 1) {
    const c = pointAt(i, phase);
    const hw = halfWidth(i / (SAMPLES - 1));
    const n = normals[i];
    forward.push(`${(c.x + n.x * hw).toFixed(1)} ${(c.y + n.y * hw).toFixed(1)}`);
    backward.push(`${(c.x - n.x * hw).toFixed(1)} ${(c.y - n.y * hw).toFixed(1)}`);
  }

  backward.reverse();
  return `M ${forward.join(' L ')} L ${backward.join(' L ')} Z`;
}

function placeFins(host: Element | null, from: number, to: number, phase: number): void {
  if (!host) return;
  const fins = host.children;
  const span = to - from;

  for (let i = 0; i < fins.length; i += 1) {
    const fin = fins[i] as SVGPathElement;
    if (span <= 0) {
      fin.setAttribute('transform', 'scale(0)');
      continue;
    }
    const idx = Math.round(from + (span * (i + 0.5)) / fins.length);
    const c = pointAt(idx, phase);
    const t = idx / (SAMPLES - 1);
    const hw = halfWidth(t);
    const angle = (Math.atan2(tangents[idx].y, tangents[idx].x) * 180) / Math.PI;
    const scale = Math.max(0.15, hw / maxHalf) * headScale;
    // Seat the fin on the body's edge — anchored on the centreline it would be
    // swallowed by the body, which is twice as thick as the fin is tall.
    const n = normals[idx];
    const bx = c.x - n.x * hw * 0.85;
    const by = c.y - n.y * hw * 0.85;
    fin.setAttribute(
      'transform',
      `translate(${bx.toFixed(1)} ${by.toFixed(1)}) rotate(${angle.toFixed(1)}) scale(${scale.toFixed(2)})`,
    );
  }
}

function placeHead(phase: number): void {
  const head = el<SVGGElement>('[data-head]');
  const flip = el<SVGGElement>('[data-head-flip]');
  if (!head || !flip) return;

  const p0 = pointAt(0, phase);
  const p1 = pointAt(3, phase);
  // The head looks *away* from the body, so aim from the second point back to the first.
  const angle = (Math.atan2(p0.y - p1.y, p0.x - p1.x) * 180) / Math.PI;

  head.setAttribute(
    'transform',
    `translate(${p0.x.toFixed(1)} ${p0.y.toFixed(1)}) rotate(${angle.toFixed(1)}) scale(${headScale})`,
  );
  // Keep the skull upright rather than upside-down when it points leftwards.
  flip.setAttribute('transform', Math.abs(angle) > 90 ? 'scale(1 -1)' : 'scale(1 1)');
}

function render(phase: number): void {
  const bodyBack = el<SVGPathElement>('[data-body-back]');
  const bodyFront = el<SVGPathElement>('[data-body-front]');
  if (!bodyBack || !bodyFront) return;

  const frontEnd = Math.round((SAMPLES - 1) * FRONT_FRACTION);

  bodyBack.setAttribute('d', outline(0, SAMPLES - 1, phase));
  bodyFront.setAttribute('d', outline(0, frontEnd, phase));

  placeFins(el('[data-fins-back]'), frontEnd, SAMPLES - 2, phase);
  placeFins(el('[data-fins-front]'), 1, frontEnd, phase);
  placeHead(phase);
}

function reveal(): void {
  el('#dragon-back')?.classList.add('is-ready');
  el('#dragon-front')?.classList.add('is-ready');
}

/* ------------------------------------------------------------------ *
 * Loop + lifecycle
 * ------------------------------------------------------------------ */

function stop(): void {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = 0;
}

function tick(now: number): void {
  rafId = requestAnimationFrame(tick);
  // ~40fps is plenty for an ambient undulation and leaves headroom for scrolling.
  if (now - lastFrame < 24) return;
  lastFrame = now;
  render(now * WAVE_SPEED);
}

function start(): void {
  stop();
  if (base.length === 0) return;
  if (reduce.matches || document.hidden) {
    render(0);
    return;
  }
  rafId = requestAnimationFrame(tick);
}

function refresh(): void {
  if (layout()) {
    render(performance.now() * WAVE_SPEED);
    reveal();
    start();
  } else {
    stop();
  }
}

function scheduleRefresh(): void {
  window.clearTimeout(relayoutTimer);
  relayoutTimer = window.setTimeout(refresh, 160);
}

document.addEventListener('astro:page-load', scheduleRefresh);
document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
window.addEventListener('resize', scheduleRefresh, { passive: true });
reduce.addEventListener('change', refresh);

// The page grows and shrinks when the language changes or reveals finish, so
// keep the spine pinned to wherever the cards actually ended up.
if ('ResizeObserver' in window) {
  new ResizeObserver(scheduleRefresh).observe(document.body);
}

if (document.readyState === 'complete') refresh();
else window.addEventListener('load', refresh);
