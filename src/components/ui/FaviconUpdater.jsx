import { useEffect } from 'react';
import { useSettings } from '../../contexts/SettingsContext';

/**
 * Watches settings.seo_favicon_url and updates the browser tab favicon
 * dynamically whenever the admin changes it, without a redeploy.
 */
export default function FaviconUpdater() {
  const { settings } = useSettings();

  useEffect(() => {
    const url = settings.seo_favicon_url;
    if (!url) return; // keep the static /favicon.png from index.html

    let link = document.getElementById('dynamic-favicon');
    if (!link) {
      link = document.createElement('link');
      link.id = 'dynamic-favicon';
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.setAttribute('type', url.endsWith('.svg') ? 'image/svg+xml' : 'image/png');
    // Add cache-buster so browsers re-fetch the new favicon instead of serving the old cached one
    link.setAttribute('href', `${url}?v=${Date.now()}`);
  }, [settings.seo_favicon_url]);

  return null;
}
