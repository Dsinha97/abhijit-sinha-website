import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

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
  integrations: [tailwind(), sitemap()],
});
