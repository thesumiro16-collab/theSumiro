import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export const DEFAULT_SETTINGS = {
  enquiry_phone: '+91 79908 63721',
  alt_enquiry_phone: '+91 99254 39839',
  enquiry_email: 'info@sumiro.in',
  home_video_url: '',
  home_video_thumbnail: '',
  collection_slides: [],
  maintenance_mode: false,
  // About / Our Story
  about_founding_year: '2003',
  about_story_title: "Rooted in Surat's Textile Heritage",
  about_story_p1: "We started The Sumiro back in 2003, right here in Surat — a city that lives and breathes textiles. What began as a small operation has grown into a full-fledged fabric design factory, but our approach hasn't changed much. We still care about every design the same way we did on day one.",
  about_story_p2: "Our team includes designers and weavers who have spent years — some even decades — doing this. We combine that experience with modern machines to make sure you get great quality without long waiting times.",
  // SEO
  seo_keywords: 'fabric design, silk brocade, jacquard weave, zari embroidery, Surat textiles, premium fabrics India, custom fabric manufacturer, The Sumiro',
  seo_og_image: '',
  seo_favicon_url: '',
  seo_google_verification: 'N7yk9uw7RrScjpIep5-JQL2QrXxXd1pKWhx5mRha61Y',
  seo_home_title: 'The Sumiro — Premium Fabric Designs from Surat, India',
  seo_home_description: 'The Sumiro crafts premium silk brocades, jacquard weaves, and artisanal embroideries from Surat, India. Bespoke fabric designs blending heritage craftsmanship with modern looms since 2003.',
  seo_about_title: 'About Us',
  seo_about_description: 'Founded in Surat in 2003, The Sumiro is a fabric design factory blending traditional Indian craftsmanship with modern looms. Quality-first, on-time delivery, and innovative textile design.',
  seo_contact_title: 'Contact Us',
  seo_contact_description: 'Get in touch with The Sumiro for premium fabric design enquiries. Visit our factory in Surat, Gujarat, or reach us by phone, email, or WhatsApp.',
};

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('designs')
        .select('description')
        .eq('design_no', 'SYSTEM_SETTINGS')
        .maybeSingle();

      if (error) throw error;

      if (data?.description) {
        try {
          const parsed = JSON.parse(data.description);
          setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        } catch {
          setSettings(DEFAULT_SETTINGS);
        }
      } else {
        setSettings(DEFAULT_SETTINGS);
      }
    } catch (err) {
      console.error('Failed to load settings from Supabase, using defaults:', err);
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return (
    <SettingsContext.Provider value={{ settings, loading, refetch: loadSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
