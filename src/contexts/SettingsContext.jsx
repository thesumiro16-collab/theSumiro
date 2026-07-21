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
  // Countdown settings
  countdown_mode: false,
  countdown_title: 'Exquisite New Collection Drop',
  countdown_description: 'We are preparing a brand new collection of premium woven silks and jacquards. Stay tuned for the drop!',
  countdown_target_date: '',
  // About / Our Story
  about_founding_year: '2006',
  about_story_title: "Rooted in Surat's Textile Heritage",
  about_story_p1: "We started The Sumiro back in 2006, right here in Surat — a city that lives and breathes textiles. What began as a small operation has grown into a full-fledged fabric design factory, but our approach hasn't changed much. We still care about every design the same way we did on day one.",
  about_story_p2: "Our team includes designers and weavers who have spent years — some even decades — doing this. We combine that experience with modern machines to make sure you get great quality without long waiting times.",
  // Craft & Process Section Settings
  craft_section_subtitle: 'Our Craft & Process',
  craft_section_title: 'Woven with Intention, Crafted to Inspire',
  craft_manufacture_desc: 'We supply premium fabric weaves designed to satisfy high-end boutique standards, luxury garment houses, and wholesale suppliers. Every meter represents flawless embroidery work and deep texture detail.',
  craft_process_desc: 'Our manufacturing pipeline ensures complete precision from raw fabric sourcing through computerized design layouts, meticulous embroidery production, and multi-tier quality checks.',
  craft_promise_desc: 'Our commitment to wholesalers, retailers, and export houses is absolute. We guarantee consistency in thread quality, reliable dispatch schedules, and premium manufacturing support.',
  craft_manufacture_list: [
    'Premium Silks & Zari Brocades',
    'Luxury Jacquard Weave Textiles',
    'Bespoke Artisanal Embroideries'
  ],
  craft_process_list: [
    'Raw Silk & Thread Sourcing',
    'Computerized CAD Design Patterns',
    'Modern High-Precision Looms Production'
  ],
  craft_promise_list: [
    'Flawless Thread Consistency',
    'Guaranteed On-Time Dispatches',
    'Custom Designing Support'
  ],
  // Instagram reels video loops
  instagram_reel_1: 'https://assets.mixkit.co/videos/preview/mixkit-sewing-machine-stitching-a-fabric-close-up-40455-large.mp4',
  instagram_reel_2: 'https://assets.mixkit.co/videos/preview/mixkit-working-on-a-weaving-loom-40333-large.mp4',
  instagram_reel_3: 'https://assets.mixkit.co/videos/preview/mixkit-fabrics-hanging-in-a-market-stall-40457-large.mp4',
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
