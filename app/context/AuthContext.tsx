import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AuthUser } from '@/types/health';
import { storage } from '@/services/storage';
import { isSupabaseConfigured, supabase } from '@/services/supabase';
import { generateId } from '@/utils/recipe';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  isCloudAuth: boolean;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signUp: (
    displayName: string,
    email: string,
    password: string
  ) => Promise<{ ok: boolean; error?: string }>;
  signInDemo: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (isSupabaseConfigured && supabase) {
          const { data } = await supabase.auth.getSession();
          if (data?.session?.user && mounted) {
            const sbUser = data.session.user;
            const authUser: AuthUser = {
              id: sbUser.id,
              email: sbUser.email || '',
              displayName:
                (sbUser.user_metadata?.display_name as string) ||
                sbUser.email?.split('@')[0] ||
                'SnapCook User',
              createdAt: Date.now(),
              isCloudUser: true,
            };
            setUser(authUser);
            await storage.saveAuthUser(authUser);
            setIsAuthLoading(false);
            return;
          }
        }
        const stored = await storage.loadAuthUser();
        if (mounted && stored) {
          setUser(stored);
        }
      } catch (err) {
        console.warn('[AuthContext] Session hydration error:', err);
      } finally {
        if (mounted) setIsAuthLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const signIn = useCallback(
    async (
      rawEmail: string,
      password: string
    ): Promise<{ ok: boolean; error?: string }> => {
      const email = rawEmail.trim().toLowerCase();
      if (!email.includes('@')) {
        return { ok: false, error: 'INVALID_EMAIL' };
      }
      if (password.length < 6) {
        return { ok: false, error: 'SHORT_PASSWORD' };
      }

      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          return { ok: false, error: error.message };
        }
        if (data.user) {
          const authUser: AuthUser = {
            id: data.user.id,
            email: data.user.email || email,
            displayName:
              (data.user.user_metadata?.display_name as string) ||
              email.split('@')[0],
            createdAt: Date.now(),
            isCloudUser: true,
          };
          setUser(authUser);
          await storage.saveAuthUser(authUser);
          return { ok: true };
        }
      }

      // Local device account lookup or auto-create if first time on device
      const accounts = await storage.loadLocalAccounts();
      const existing = accounts[email];
      if (existing) {
        if (existing.password !== password) {
          return {
            ok: false,
            error: 'Invalid email or password.',
          };
        }
        setUser(existing.user);
        await storage.saveAuthUser(existing.user);
        return { ok: true };
      }

      const newUser: AuthUser = {
        id: `usr_${generateId()}`,
        email,
        displayName: email.split('@')[0],
        createdAt: Date.now(),
        isCloudUser: false,
      };
      accounts[email] = { user: newUser, password };
      await storage.saveLocalAccounts(accounts);
      setUser(newUser);
      await storage.saveAuthUser(newUser);
      return { ok: true };
    },
    []
  );

  const signUp = useCallback(
    async (
      rawName: string,
      rawEmail: string,
      password: string
    ): Promise<{ ok: boolean; error?: string }> => {
      const displayName = rawName.trim();
      const email = rawEmail.trim().toLowerCase();
      if (!displayName) {
        return { ok: false, error: 'MISSING_NAME' };
      }
      if (!email.includes('@')) {
        return { ok: false, error: 'INVALID_EMAIL' };
      }
      if (password.length < 6) {
        return { ok: false, error: 'SHORT_PASSWORD' };
      }

      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName },
          },
        });
        if (error) {
          return { ok: false, error: error.message };
        }
        if (data.user) {
          const authUser: AuthUser = {
            id: data.user.id,
            email: data.user.email || email,
            displayName,
            createdAt: Date.now(),
            isCloudUser: true,
          };
          setUser(authUser);
          await storage.saveAuthUser(authUser);
          return { ok: true };
        }
      }

      const accounts = await storage.loadLocalAccounts();
      const newUser: AuthUser = {
        id: `usr_${generateId()}`,
        email,
        displayName,
        createdAt: Date.now(),
        isCloudUser: false,
      };
      accounts[email] = { user: newUser, password };
      await storage.saveLocalAccounts(accounts);
      setUser(newUser);
      await storage.saveAuthUser(newUser);
      return { ok: true };
    },
    []
  );

  const signInDemo = useCallback(async () => {
    const demoUser: AuthUser = {
      id: 'usr_demo_snapcook',
      email: 'demo@snapcook.ai',
      displayName: 'Minh Anh',
      createdAt: Date.now(),
      isCloudUser: false,
    };
    setUser(demoUser);
    await storage.saveAuthUser(demoUser);
  }, []);

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('[AuthContext] Supabase signOut error:', err);
      }
    }
    setUser(null);
    await storage.saveAuthUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isAuthLoading,
        isCloudAuth: isSupabaseConfigured,
        signIn,
        signUp,
        signInDemo,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
