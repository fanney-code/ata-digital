'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, UserRole } from '@/lib/types';
import { upsertProfile, createRegistrarByAdmin } from '@/lib/api/supabase-service';

interface AuthContextType {
  user: Profile | null;
  loading: boolean;
  login: (email: string, fullName: string, role: UserRole) => Promise<Profile>;
  logout: () => void;
  createRegistrar: (email: string, fullName: string) => Promise<Profile>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'ata_digital_auth_user_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch {
          setUser(null);
        }
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, fullName: string, role: UserRole): Promise<Profile> => {
    setLoading(true);
    try {
      const profile = await upsertProfile(email, fullName, role);
      setUser(profile);
      if (typeof window !== 'undefined') {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
      }
      return profile;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  };

  const createRegistrar = async (email: string, fullName: string): Promise<Profile> => {
    return createRegistrarByAdmin(email, fullName);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, createRegistrar }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
