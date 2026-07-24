// Presentation-deck controller.
//
// Turns the home page's <main data-deck> into a slide deck: each direct child
// section is a slide. This script tracks which slide fills the viewport, marks
// it `.is-current` (which replays that slide's grand entrance via CSS), builds
// a clickable dot rail, drives the per-slide backdrop mood shift, and gives the
// deck real keyboard navigation (arrows / space / Home / End).
//
// Everything is a no-op on pages without <main data-deck> (e.g. the blog), so
// it can live in the shared layout.

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

// A cinematic hue offset applied to the backdrop, one per slide, cycled.
// Kept gentle so each scene shifts mood without muddying the glass cards.
const HUES = [0, 18, -16, 28, -24, 12];

let slides: HTMLElement[] = [];
let rail: HTMLElement | null = null;
let observer: IntersectionObserver | null = null;
let currentIndex = 0;
const ratios = new WeakMap<HTMLElement, number>();

function deckMain(): HTMLElement | null {
  return document.querySelector<HTMLElement>('main[data-deck]');
}

function teardown(): void {
  observer?.disconnect();
  observer = null;
  rail?.remove();
  rail = null;
  slides = [];
  document.documentElement.style.removeProperty('--deck-hue');
}

function setCurrent(index: number): void {
  if (index < 0 || index >= slides.length) return;
  currentIndex = index;

  slides.forEach((slide, i) => slide.classList.toggle('is-current', i === index));

  if (rail) {
    Array.from(rail.children).forEach((dot, i) =>
      dot.setAttribute('aria-current', i === index ? 'true' : 'false'),
    );
  }

  document.documentElement.style.setProperty('--deck-hue', `${HUES[index % HUES.length]}deg`);
}

function goTo(index: number): void {
  const clamped = Math.max(0, Math.min(slides.length - 1, index));
  slides[clamped]?.scrollIntoView({
    behavior: reduce.matches ? 'auto' : 'smooth',
    block: 'start',
  });
  setCurrent(clamped);
}

/** A short label for the dot's accessible name, taken from the slide heading. */
function labelFor(slide: HTMLElement, i: number): string {
  const heading = slide.querySelector('.eyebrow, h1, h2');
  const text = heading?.textContent?.trim();
  return text ? text.replace(/\s+/g, ' ').slice(0, 48) : `Slide ${i + 1}`;
}

function buildRail(): void {
  rail = document.createElement('nav');
  rail.className = 'deck-rail';
  rail.setAttribute('aria-label', 'Slide navigation');

  slides.forEach((slide, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', labelFor(slide, i));
    dot.setAttribute('aria-current', i === 0 ? 'true' : 'false');
    dot.addEventListener('click', () => goTo(i));
    rail!.appendChild(dot);
  });

  document.body.appendChild(rail);
}

function onKey(event: KeyboardEvent): void {
  if (!deckMain() || slides.length === 0) return;

  // Never hijack typing in the search field or any editable control.
  const target = event.target as HTMLElement | null;
  if (
    target &&
    (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
  ) {
    return;
  }

  switch (event.key) {
    case 'ArrowDown':
    case 'PageDown':
      event.preventDefault();
      goTo(currentIndex + 1);
      break;
    case 'ArrowUp':
    case 'PageUp':
      event.preventDefault();
      goTo(currentIndex - 1);
      break;
    case ' ':
      event.preventDefault();
      goTo(currentIndex + (event.shiftKey ? -1 : 1));
      break;
    case 'Home':
      event.preventDefault();
      goTo(0);
      break;
    case 'End':
      event.preventDefault();
      goTo(slides.length - 1);
      break;
    default:
      break;
  }
}

function init(): void {
  teardown();

  const main = deckMain();
  if (!main) return;

  slides = Array.from(main.children).filter(
    (node): node is HTMLElement => node instanceof HTMLElement,
  );
  if (slides.length === 0) return;

  buildRail();
  setCurrent(0);

  // The slide holding the largest share of the viewport is the active one.
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => ratios.set(entry.target as HTMLElement, entry.intersectionRatio));

      let bestIndex = currentIndex;
      let bestRatio = -1;
      slides.forEach((slide, i) => {
        const r = ratios.get(slide) ?? 0;
        if (r > bestRatio) {
          bestRatio = r;
          bestIndex = i;
        }
      });

      if (bestRatio >= 0.4 && bestIndex !== currentIndex) setCurrent(bestIndex);
    },
    { threshold: [0, 0.25, 0.5, 0.75, 1] },
  );

  slides.forEach((slide) => observer!.observe(slide));
}

document.addEventListener('keydown', onKey);
document.addEventListener('astro:page-load', init);
// Tear the rail and observer down before ClientRouter swaps the page out.
document.addEventListener('astro:before-swap', teardown);

if (document.readyState !== 'loading') init();
else document.addEventListener('DOMContentLoaded', init);
