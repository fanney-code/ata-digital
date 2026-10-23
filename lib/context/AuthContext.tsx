'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Profile, UserRole, ActorContext } from '@/lib/types';

// localStorage is only used to persist the email hint for the login form,
// NEVER for identity, role, institutionId, or authorization decisions.
const LOGIN_EMAIL_HINT_KEY = 'ata_portal_login_email_hint_v1';

interface AuthContextType {
  user: Profile | null;
  actorContext: ActorContext | undefined;
  loading: boolean;
  login: (email: string, password: string) => Promise<Profile>;
  logout: () => void;
  createRegistrar: (email: string, fullName: string, institutionId?: string) => Promise<Profile>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // actorContext is always derived from the server-verified user object.
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
    // Resolve identity from the HTTP-only session cookie — never from localStorage.
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
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    resolveServerSession();
  }, []);

  const login = async (email: string, password: string): Promise<Profile> => {
    setLoading(true);
    try {
      // Single server round-trip: validate credentials and set the session cookie.
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid email or password.');
      }

      const profile: Profile = data.user;
      setUser(profile);

      if (typeof window !== 'undefined') {
        localStorage.setItem(LOGIN_EMAIL_HINT_KEY, email);
      }

      return profile;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOGIN_EMAIL_HINT_KEY);
    }
    fetch('/api/auth/session', { method: 'DELETE', credentials: 'include' }).catch(() => {});
  };

  const createRegistrar = async (email: string, fullName: string, institutionId?: string): Promise<Profile> => {
    const res = await fetch('/api/admin/registrars', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, fullName, institutionId }),
      credentials: 'include',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
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
