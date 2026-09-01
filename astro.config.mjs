import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import youtubeThumbnails from './scripts/youtube-thumbnails.mjs';

// Deployed on Vercel (static output, no adapter) at the domain root, with
// abhijitsinha.in registered and DNS-hosted at GoDaddy — see
// docs/wiki/deployment-domain.md.
//
// Both values stay env-driven so a preview deployment or a future host change is
// a config edit, not a template rewrite. `||` (not `??`) is deliberate: a host
// that passes an unset variable as '' would otherwise hand Astro `site: ''`.
const SITE_URL = process.env.SITE_URL || 'https://abhijitsinha.in';
const BASE_PATH = process.env.BASE_PATH || '';

export default defineConfig({
  site: SITE_URL,
  base: BASE_PATH,
  // The admin panel must never be advertised in the sitemap. This matters the
  // moment the site becomes indexable at cutover, when robots.txt's blanket
  // Disallow is lifted.
  integrations: [
    tailwind(),
    sitemap({ filter: (page) => !page.includes('/admin') }),
    // Downloads YouTube posters at build time so the browser never requests
    // anything from Google before a visitor clicks play. Never fails the build.
    youtubeThumbnails(),
  ],
});
