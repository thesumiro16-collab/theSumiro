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
  // About / Our Story (editable from admin → Story Editor)
  about_founding_year: '2003',
  about_story_title: "Rooted in Surat's Textile Heritage",
  about_story_p1: "We started The Sumiro back in 2003, right here in Surat — a city that lives and breathes textiles. What began as a small operation has grown into a full-fledged fabric design factory, but our approach hasn't changed much. We still care about every design the same way we did on day one.",
  about_story_p2: "Our team includes designers and weavers who have spent years — some even decades — doing this. We combine that experience with modern machines to make sure you get great quality without long waiting times.",
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
