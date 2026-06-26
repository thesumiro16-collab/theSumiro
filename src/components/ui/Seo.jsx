import { useEffect } from 'react';
import { useSettings } from '../../contexts/SettingsContext';

const SITE_NAME = 'The Sumiro';
const SITE_URL = 'https://thesumiro.com';
const FALLBACK_IMAGE = `${SITE_URL}/favicon.png`;

/**
 * Per-page SEO manager. Reads global settings (keywords, OG image,
 * Google verification) from SettingsContext automatically, so every
 * change saved in the admin SEO panel takes effect without a redeploy.
 *
 * Per-page title and description are passed as props.
 *
 * Usage:
 *   <Seo title="About Us" description="..." path="/about" />
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

export default function Seo({ title, description, path = '/', noindex = false }) {
  const { settings } = useSettings();

  useEffect(() => {
    const fullTitle = title
      ? `${title} — ${SITE_NAME}`
      : `${SITE_NAME} — Premium Fabric Designs from Surat, India`;
    const url      = `${SITE_URL}${path}`;
    const ogImage  = settings.seo_og_image || FALLBACK_IMAGE;
    const keywords = settings.seo_keywords;
    const gVerify  = settings.seo_google_verification;

    document.title = fullTitle;

    upsertMeta('name', 'description',          description);
    upsertMeta('name', 'keywords',             keywords);
    upsertMeta('name', 'robots',               noindex ? 'noindex, nofollow' : 'index, follow');
    upsertMeta('name', 'google-site-verification', gVerify);
    upsertCanonical(url);

    // Open Graph
    upsertMeta('property', 'og:title',       fullTitle);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url',         url);
    upsertMeta('property', 'og:image',       ogImage);

    // Twitter
    upsertMeta('name', 'twitter:title',       fullTitle);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image',       ogImage);
  }, [
    title, description, path, noindex,
    settings.seo_og_image,
    settings.seo_keywords,
    settings.seo_google_verification,
  ]);

  return null;
}
