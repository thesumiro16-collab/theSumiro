import { useEffect } from 'react';
import { useSettings } from '../../contexts/SettingsContext';

/**
 * Injects the favicon <link> tag dynamically using the URL saved in
 * admin → SEO Settings. No static favicon file is used — if no URL
 * is saved in settings, no favicon tag is added and the browser shows
 * its default blank tab icon.
 */
export default function FaviconUpdater() {
  const { settings } = useSettings();

  useEffect(() => {
    const url = settings.seo_favicon_url;

    // Remove any existing favicon link first
    const existing = document.getElementById('dynamic-favicon');
    if (existing) existing.remove();

    // Only inject if a URL has been saved in admin
    if (!url) return;

    const link = document.createElement('link');
    link.id = 'dynamic-favicon';
    link.rel = 'icon';
    link.setAttribute('type', url.endsWith('.svg') ? 'image/svg+xml' : 'image/png');
    // Cache-buster forces the browser to re-fetch instead of serving a cached icon
    link.setAttribute('href', `${url}?v=${Date.now()}`);
    document.head.appendChild(link);
  }, [settings.seo_favicon_url]);

  return null;
}
