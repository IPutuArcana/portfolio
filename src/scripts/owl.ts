// Perch the owl on a card, and fly it to a card in whichever section the user
// navigates to. The owl is positioned in document coordinates (absolute), so it
// stays glued to its card as the page scrolls; only navigation moves it.

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Section key -> selector for the card the owl should perch on.
const PERCH: Record<string, string> = {
  about: '#about .about-portrait',
  skills: '#skills .skill-group',
  projects: '#projects .project-card',
  contact: '#contact .contact-info',
  blog: '.blog-grid .post-card',
  home: '.hero .stat',
};

let currentEl: Element | null = null;
let lastX = 60;

function owlEl(): HTMLElement | null {
  return document.getElementById('owl');
}

function perchOn(el: Element, animate: boolean): void {
  const owl = owlEl();
  if (!owl) return;

  const r = el.getBoundingClientRect();
  const docLeft = r.left + window.scrollX;
  const docTop = r.top + window.scrollY;

  const ow = owl.offsetWidth || 92;
  const oh = owl.offsetHeight || 112;

  // Sit near the left-ish of the card's top edge, feet overlapping it slightly.
  const x = docLeft + Math.min(r.width * 0.16, r.width - ow - 8);
  const y = docTop - oh + 14;

  const dir = x < lastX ? -1 : 1;
  lastX = x;
  currentEl = el;

  owl.style.setProperty('--owl-dir', String(dir));

  const noAnim = !animate || reduce;
  owl.classList.toggle('no-anim', noAnim);

  if (!noAnim) {
    owl.classList.remove('is-flying');
    // reflow so the flight animation restarts even on rapid re-targets
    void owl.offsetWidth;
    owl.classList.add('is-flying');
    window.clearTimeout((owl as unknown as { _t?: number })._t);
    (owl as unknown as { _t?: number })._t = window.setTimeout(
      () => owl.classList.remove('is-flying'),
      1300,
    );
  }

  owl.style.setProperty('--owl-x', `${x}px`);
  owl.style.setProperty('--owl-y', `${y}px`);
  owl.classList.add('is-ready');
}

function targetFor(key: string): Element | null {
  const sel = PERCH[key];
  return sel ? document.querySelector(sel) : null;
}

function perchDefault(animate: boolean): void {
  const isBlog = location.pathname.replace(/\/+$/, '').endsWith('/blog');
  const el = targetFor(isBlog ? 'blog' : 'home') ?? document.querySelector('.panel');
  if (el) perchOn(el, animate);
}

// Fly to the section a clicked nav link points at.
document.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const link = target.closest('a[href]');
  if (!link) return;

  const href = link.getAttribute('href') || '';
  const hash = href.includes('#') ? href.split('#')[1] : '';
  if (!hash || !PERCH[hash]) return;

  const el = targetFor(hash);
  if (!el) return;
  // Let the smooth-scroll begin; the owl's target is a stable document position.
  window.setTimeout(() => perchOn(el, true), 60);
});

// Re-perch to the right card after a client-side navigation (e.g. Blog page).
document.addEventListener('astro:page-load', () => perchDefault(true));

// Keep the perch aligned when the layout reflows.
window.addEventListener(
  'resize',
  () => {
    if (currentEl && document.body.contains(currentEl)) perchOn(currentEl, false);
    else perchDefault(false);
  },
  { passive: true },
);

// Initial perch — wait until fonts/images settle so card positions are final.
if (document.readyState === 'complete') perchDefault(false);
else window.addEventListener('load', () => perchDefault(false));
