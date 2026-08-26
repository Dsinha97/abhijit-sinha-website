import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

// The custom domain (abhijitsinha.in) is currently parked at GoDaddy and is NOT
// yet pointed at this deployment — see docs/wiki/deployment-domain.md.
// Until that Phase 5 cutover happens, the site ships to the default GitHub
// Pages project sub-path, which means it needs an explicit `base`.
//
// Both values are env-driven so the eventual domain switch is a config change,
// not a template rewrite. Set SITE_URL / BASE_PATH in the deploy workflow when
// that day comes (BASE_PATH='' + SITE_URL='https://abhijitsinha.in').
const SITE_URL = process.env.SITE_URL ?? 'https://dsinha97.github.io';
const BASE_PATH = process.env.BASE_PATH ?? '/abhijit-sinha-website';

export default defineConfig({
  site: SITE_URL,
  base: BASE_PATH,
  integrations: [tailwind(), sitemap()],
});
