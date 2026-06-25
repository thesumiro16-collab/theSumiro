import { useEffect } from 'react';

const SITE_NAME = 'The Sumiro';
const SITE_URL = 'https://sumiro.in';
const DEFAULT_IMAGE = `${SITE_URL}/The%20Sumiro%20Logo.png`;

/**
 * Dependency-free per-page SEO manager.
 * Updates document.title, meta description, canonical link, and the
 * Open Graph / Twitter tags whenever a page mounts or its props change.
 *
 * Usage:
 *   <Seo
 *     title="About Us"
 *     description="..."
 *     path="/about"
 *   />
 */
function upsertMeta(attr, key, content) {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export default function Seo({ title, description, path = '/', image = DEFAULT_IMAGE, noindex = false }) {
  useEffect(() => {
    const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — Premium Fabric Designs from Surat, India`;
    const url = `${SITE_URL}${path}`;

    document.title = fullTitle;

    upsertMeta('name', 'description', description);
    upsertMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
    upsertCanonical(url);

    // Open Graph
    upsertMeta('property', 'og:title', fullTitle);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', url);
    upsertMeta('property', 'og:image', image);

    // Twitter
    upsertMeta('name', 'twitter:title', fullTitle);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', image);
  }, [title, description, path, image, noindex]);

  return null;
}
