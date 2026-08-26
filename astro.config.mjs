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
// CI sets an unset repo variable to '' (empty string), not undefined, so `??`
// alone isn't enough — it would hand Astro an invalid `site: ''`.
//
// BASE_PATH can't use the same `|| default` trick: Phase 5 (custom domain)
// needs to set it to '' on purpose, and `||` can't tell "explicitly empty"
// apart from "unset". Instead, key the default off whether SITE_URL was
// overridden at all — once a custom domain is configured, root-base is the
// correct default with no BASE_PATH variable needed.
const usingCustomDomain = Boolean(process.env.SITE_URL);
const SITE_URL = process.env.SITE_URL || 'https://dsinha97.github.io';
const BASE_PATH = process.env.BASE_PATH || (usingCustomDomain ? '' : '/abhijit-sinha-website');

export default defineConfig({
  site: SITE_URL,
  base: BASE_PATH,
  integrations: [tailwind(), sitemap()],
});
