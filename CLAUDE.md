# Just Canvass Marketing Site

Single-page marketing site for Just Canvass (justcanvass.ca), built with Parcel and deployed to GitHub Pages via `npm run deploy`.

## Keep discovery/SEO files in sync with content

Whenever making major changes to the content of `src/index.html` (sections added/removed, features, pricing, coverage, integrations, contact info), also update everything that describes that content:

- **Meta tags** in `src/index.html` `<head>`: title, description, keywords, Open Graph, and Twitter tags
- **JSON-LD structured data** in `src/index.html`: WebSite, SiteNavigationElement, and SoftwareApplication blocks (especially `featureList` and navigation anchors)
- **`src/llms.txt`**: the blockquote summary, the inline key facts (features, coverage, integrations, pricing, contact), and the link sections
- **`src/sitemap.xml`**: add/remove URLs for any new or deleted sections/pages, and bump `<lastmod>` dates
- **`src/robots.txt`**: rarely changes, but verify it still points to the right sitemap

These static files (`CNAME`, `sitemap.xml`, `robots.txt`, `llms.txt`) are copied from `src/` to `dist/` by the `build` script in `package.json` — any new root-level static file must be added to that copy chain or it won't deploy.
