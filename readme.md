# SSU Freedom Wall

A small anonymous submission wall for Samar State University.

Visitors submit messages via a simple form; each submission lands as a `.md` 
file in a private GitHub repo (freedomwall-inbox) that only I can read. I 
manually review and post selected messages to the [Facebook page](https://facebook.com/freedomwallssu).

## Stack
- Astro (frontend)
- Cloudflare Pages (hosting)
- Cloudflare Functions (submission API)
- GitHub Contents API (storage)
- Facet (self-hosted analytics)

## Structure
- `src/pages/` — public pages
- `src/components/` — form, modals, footer
- `functions/api/submit.js` — submission endpoint
- `public/` — static assets