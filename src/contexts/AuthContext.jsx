import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // Supabase auth user object
  const [profile, setProfile] = useState(null); // user_profiles row
  const [loading, setLoading] = useState(true); // true until session resolved

  async function fetchProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user profile details:', error);
        setProfile(null);
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error('Exception thrown while fetching profile:', err);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Resolve initial session safely
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error resolving initial session:', err);
        setLoading(false);
      });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          try {
            await fetchProfile(session.user.id);
          } catch (err) {
            console.error('Error in onAuthStateChange profile fetch:', err);
            setLoading(false);
          }
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signOut() {
    await supabase.auth.signOut();
    // onAuthStateChange will set user/profile to null
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
