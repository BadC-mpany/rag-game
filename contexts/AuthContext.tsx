import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { getSupabaseClient } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseClient();

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signUp = async (email: string, password: string, displayName: string) => {
    if (!supabase) return { error: new Error('Supabase not configured') as AuthError };
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          display_name: displayName,
          total_score: 0,
          current_level: 1
        }
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    if (!supabase) return { error: new Error('Supabase not configured') as AuthError };
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    // Initialize user in leaderboard if sign in successful
    if (!error && data.session) {
      try {
        await fetch('/api/user/initialize', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${data.session.access_token}`,
            'Content-Type': 'application/json'
          }
        });
      } catch (e) {
        console.log('Failed to initialize user in leaderboard:', e);
      }
    }
    
    return { error };
  };

  const signOut = async () => {
    if (!supabase) return { error: new Error('Supabase not configured') as AuthError };
    
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const resetPassword = async (email: string) => {
    if (!supabase) return { error: new Error('Supabase not configured') as AuthError };
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    });
    return { error };
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
