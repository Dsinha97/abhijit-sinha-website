/**
 * Prefixes an internal path with the site's configured base path.
 *
 * This project deploys to a GitHub Pages *project sub-path*
 * (e.g. /abhijit-sinha-website/) until the custom-domain cutover in
 * docs/wiki/deployment-domain.md happens. A raw "/solutions"-style href
 * works fine in `npm run dev` (base is applied automatically there) but
 * 404s in production if it bypasses this helper — always use `url()` for
 * internal links, image `src`, and any other site-relative asset path.
 *
 * import.meta.env.BASE_URL reflects the `base` config value verbatim, which
 * may or may not have a trailing slash — don't assume either way. `path`
 * should be given without a leading slash (e.g. url('solutions'), url('images/logo.png')).
 */
export function url(path: string = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/+$/, ''); // strip any trailing slash
  const cleanPath = path.replace(/^\/+/, '');
  return cleanPath ? `${base}/${cleanPath}` : `${base}/`;
}
