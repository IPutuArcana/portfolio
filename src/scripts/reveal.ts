const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Initialise reveals for any `.reveal` element that hasn't been set up yet.
// Elements already marked with `data-revealed` (e.g. the persisted header and
// social rail carried across an Astro ClientRouter navigation) are skipped so
// they don't flash and re-animate on every page swap. Freshly rendered page
// content has no attribute yet, so it animates in on each navigation.
function initReveals() {
  if (reducedMotion) return;

  // Skip anything inside the presentation deck — deck.ts owns those entrances,
  // toggling `.is-current` per slide, and the two systems must not both drive
  // the same `.reveal` elements.
  const targets = Array.from(
    document.querySelectorAll<HTMLElement>('.reveal:not([data-revealed])'),
  ).filter((el) => !el.closest('[data-deck]'));
  if (targets.length === 0) return;

  targets.forEach((el) => el.setAttribute('data-revealed', 'false'));

  // Force two paints before observing, so the browser commits the hidden
  // state first. Without this, elements already in the viewport at load
  // (the Hero panel, most of the time) can have their "hidden" and
  // "visible" states collapsed into a single paint, skipping the transition
  // entirely.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.setAttribute('data-revealed', 'true');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15 },
      );

      targets.forEach((el) => observer.observe(el));
    });
  });
}

initReveals();
// Replay entrance animations for the new page's content after each navigation.
// `astro:after-swap` fires before the swapped-in DOM is painted, so the hidden
// state is applied first — no flash of fully visible content before it animates.
document.addEventListener('astro:after-swap', initReveals);
