// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // User site — served from the domain root, so no `base` is needed and the
  // existing absolute links (/, /#about, /blog, /favicon.svg) keep working.
  site: 'https://iputuarcana.github.io',
});
