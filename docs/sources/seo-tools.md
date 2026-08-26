**1.Install and Configure the Sitemap Integration:**

Install the official Astro sitemap package:

Bash

```
npx astro add sitemap
```

Ensure your `astro.config.mjs` has the target root URL and the sitemap integration listed:

JavaScript

```
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://abhijitsinha.in',
  integrations: [tailwind(), sitemap()],
});
```

**2.Create the Search Engine Directives (public/robots.txt):**

Create a static `robots.txt` file in your `public/` directory so web crawlers discover your sitemap automatically:

Plaintext

```
User-agent: *
Allow: /

Sitemap: https://abhijitsinha.in/sitemap-index.xml
```

**3.Prepare Social Share Card Asset:**

Add a high-resolution preview image (`og-image.jpg`) to your `public/` folder with dimensions of **1200 x 630 pixels**. This ensures WhatsApp, LinkedIn, X, and Facebook render an rich preview card instead of a plain link.

**4.Build the Reusable SEO & Open Graph Component:**

Create `src/components/SEO.astro` to handle canonical links, social previews, and structured metadata:

astro

```
---
// src/components/SEO.astro
interface Props {
  title: string;
  description: string;
  image?: string;
  article?: boolean;
}

const {
  title,
  description,
  image = '/og-image.jpg',
} = Astro.props;

const canonicalURL = new URL(Astro.url.pathname, Astro.site);
const socialImageURL = new URL(image, Astro.site);
---

<!-- Global Metadata -->
<title>{title}</title>
<meta name="description" content={description} />
<link rel="canonical" href={canonicalURL} />

<!-- Open Graph / Facebook / WhatsApp -->
<meta property="og:type" content="website" />
<meta property="og:url" content={canonicalURL} />
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:image" content={socialImageURL} />
<meta property="og:site_name" content="Abhijit Sinha | AMFI-Registered MFD" />

<!-- Twitter / X Cards -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:url" content={canonicalURL} />
<meta name="twitter:title" content={title} />
<meta name="twitter:description" content={description} />
<meta name="twitter:image" content={socialImageURL} />

<!-- Financial Service JSON-LD Schema -->
<script type="application/ld+json" is:inline>
  {
    "@context": "https://schema.org",
    "@type": "FinancialService",
    "name": "Abhijit Sinha - AMFI-Registered Mutual Fund Distributor",
    "url": "https://abhijitsinha.in",
    "logo": "https://abhijitsinha.in/logo.jpg",
    "image": "https://abhijitsinha.in/banner.jpg",
    "description": "Goal-based mutual fund distribution and disciplined portfolio allocation.",
    "identifier": "ARN-367596",
    "founder": {
      "@type": "Person",
      "name": "Abhijit Sinha",
      "jobTitle": "Mutual Fund Distributor",
      "honorificSuffix": "MBA in Finance"
    }
  }
</script>
```

**5.Attach the SEO Component to BaseLayout.astro:**

Import and place `<SEO/>` directly into the `<head>` of `src/layouts/BaseLayout.astro`:

astro

```
---
// src/layouts/BaseLayout.astro
import SEO from '../components/SEO.astro';

interface Props {
  title: string;
  description: string;
  image?: string;
}

const { title, description, image } = Astro.props;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/jpeg" href="/logo.jpg" />
    
    <SEO title={title} description={description} image={image} />
  </head>
  <body class="bg-white text-slate-900 min-h-screen flex flex-col font-sans">
    <slot />
  </body>
</html>
```
LinkedIn: `https://www.linkedin.com/in/abhijit-sinha-243b7243/`