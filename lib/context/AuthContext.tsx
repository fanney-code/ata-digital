'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Profile, UserRole, ActorContext } from '@/lib/types';
import { upsertProfile } from '@/lib/api/supabase-service';

// localStorage is only used to persist the email hint for the login form,
// NEVER for identity, role, institutionId, or authorization decisions.
const LOGIN_EMAIL_HINT_KEY = 'ata_portal_login_email_hint_v1';

interface AuthContextType {
  user: Profile | null;
  actorContext: ActorContext | undefined;
  loading: boolean;
  login: (email: string, fullName: string, role: UserRole, institutionId?: string) => Promise<Profile>;
  logout: () => void;
  createRegistrar: (email: string, fullName: string, institutionId?: string) => Promise<Profile>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // actorContext is always derived from the server-verified user object.
  // It is NEVER built from localStorage, URL params, or client-supplied values.
  const actorContext = useMemo<ActorContext | undefined>(() => {
    if (!user) return undefined;
    return {
      userId: user.id,
      role: user.role,
      institutionId: user.institution_id,
      email: user.email,
    };
  }, [user]);

  useEffect(() => {
    // On mount: resolve identity from the server-side HTTP-only session cookie.
    // We do NOT read localStorage for identity — that is the security boundary.
    // loading stays true until the server responds.
    const resolveServerSession = async () => {
      try {
        const res = await fetch('/api/auth/session', {
          method: 'GET',
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user ?? null);
        } else {
          setUser(null);
        }
      } catch {
        // Network error — treat as unauthenticated
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    resolveServerSession();
  }, []);

  const login = async (email: string, fullName: string, role: UserRole, institutionId?: string): Promise<Profile> => {
    setLoading(true);
    try {
      // 1. Upsert profile in Supabase (creates or updates the profile row)
      const profile = await upsertProfile(email, fullName, role, institutionId);

      // 2. Establish the authoritative HTTP-only server session cookie
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: profile.id, email: profile.email }),
        credentials: 'include',
      });

      // 3. Re-fetch the authoritative server session (which includes institution_id from live DB)
      const sessionRes = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include',
      });
      if (sessionRes.ok) {
        const data = await sessionRes.json();
        const serverProfile = data.user ?? profile;
        setUser(serverProfile);

        // Store only the email hint for the login form (non-auth use)
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOGIN_EMAIL_HINT_KEY, email);
        }

        return serverProfile;
      }

      setUser(profile);
      return profile;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    // Clear only the login email hint
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOGIN_EMAIL_HINT_KEY);
    }
    fetch('/api/auth/session', { method: 'DELETE', credentials: 'include' }).catch(() => {});
  };

  const createRegistrar = async (email: string, fullName: string, institutionId?: string): Promise<Profile> => {
    // Delegate to the BFF — the server verifies the caller is an ADMINISTRATOR
    const res = await fetch('/api/admin/registrars', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, fullName, institutionId }),
      credentials: 'include',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create registrar');
    }
    return res.json();
  };

  return (
    <AuthContext.Provider value={{ user, actorContext, loading, login, logout, createRegistrar }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null,
      actorContext: undefined,
      loading: false,
      login: async () => ({} as Profile),
      logout: () => {},
      createRegistrar: async () => ({} as Profile),
    };
  }
  return context;
}
