'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { Landmark, Shield, Building, UserCheck, Lock, User, Mail, AlertCircle, KeyRound } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [selectedRole, setSelectedRole] = useState<'REGISTRAR' | 'ADMINISTRATOR' | 'UNIVERSAL'>('REGISTRAR');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await login(email.trim(), password);
      router.push('/dashboard');
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Authentication failed. Please verify credentials.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const placeholderEmail =
    selectedRole === 'ADMINISTRATOR'
      ? 'john@ataindia.org'
      : selectedRole === 'UNIVERSAL'
      ? 'justin@ataindia.org'
      : 'thomas@ataindia.org';

  const roles = [
    { id: 'REGISTRAR',     label: 'Registrar',  icon: UserCheck },
    { id: 'ADMINISTRATOR', label: 'Admin',       icon: Building  },
    { id: 'UNIVERSAL',     label: 'Universal',   icon: Shield    },
  ] as const;

  return (
    <div className="min-h-screen w-screen bg-[#f8fafc] flex flex-col justify-center items-center p-4 sm:p-6 text-slate-900 font-sans antialiased">
      <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-2xl shadow-xl overflow-hidden">

        {/* Brand Header */}
        <div className="p-8 border-b border-slate-100 text-center bg-slate-50/50">
          <div className="mx-auto w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-md mb-3">
            <Landmark className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">ATA Portal</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Student Registration &amp; Institution Management
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 bg-rose-50 border-b border-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <div className="p-8 space-y-6">
          {/* Role Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Select User Role
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/70">
              {roles.map(({ id, label, icon: Icon }) => {
                const isSelected = selectedRole === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedRole(id)}
                    className={`flex flex-col items-center py-2 px-1 rounded-lg text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    <Icon className="h-4 w-4 mb-1" />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={placeholderEmail}
                  className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name{' '}
                <span className="text-slate-400 font-normal">(Optional for existing accounts)</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden placeholder:text-slate-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
            >
              <Lock className="h-3.5 w-3.5" />
              {isSubmitting ? 'Authenticating...' : 'Sign In to Dashboard'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 text-center text-[11px] text-slate-400 font-medium">
          Authorized Academic Institution Management Access
        </div>
      </div>
    </div>
  );
}
