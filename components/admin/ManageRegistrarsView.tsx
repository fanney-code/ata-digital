'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Profile } from '@/lib/types';
import { fetchProfiles } from '@/lib/api/supabase-service';
import { CreateRegistrarModal } from './CreateRegistrarModal';
import { UserCheck, UserPlus, Search, Mail, Calendar, ShieldCheck, RefreshCw } from 'lucide-react';

export const ManageRegistrarsView: React.FC = () => {
  const [registrars, setRegistrars] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadRegistrars = useCallback(async () => {
    setLoading(true);
    try {
      const allProfiles = await fetchProfiles();
      const registrarList = allProfiles.filter((p) => p.role === 'REGISTRAR');
      setRegistrars(registrarList);
    } catch (err: any) {
      console.error('Error fetching registrars:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRegistrars();
  }, [loadRegistrars]);

  const filteredRegistrars = registrars.filter(
    (r) =>
      r.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Manage Registrars
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-mono text-xs font-bold border border-blue-200">
              {registrars.length} Registered
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Administrators can define, review, and manage official Registrar credentials for processing student registrations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadRegistrars}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Refresh List"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs shadow-xs transition-all shrink-0"
          >
            <UserPlus className="h-4 w-4" />
            Define New Registrar
          </button>
        </div>
      </div>

      {/* Search Filter */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name or email address..."
          className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
        />
      </div>

      {/* Registrar Directory Table / Grid */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            Loading registrars directory...
          </div>
        ) : filteredRegistrars.length === 0 ? (
          <div className="p-12 text-center">
            <UserCheck className="mx-auto h-8 w-8 text-slate-300 mb-2" />
            <h4 className="text-xs font-bold text-slate-800">No Registrars Found</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              Click &ldquo;Define New Registrar&rdquo; above to create official registrar credentials.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-400 font-semibold text-[11px]">
                  <th className="py-3.5 px-6">Registrar User</th>
                  <th className="py-3.5 px-6">Email Address</th>
                  <th className="py-3.5 px-6">Role & Status</th>
                  <th className="py-3.5 px-6">Date Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRegistrars.map((reg) => (
                  <tr key={reg.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center border border-blue-200">
                          {reg.full_name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase() || 'R'}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">
                            {reg.full_name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ID: {reg.id.slice(0, 8)}...
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-600 font-medium">
                      <span className="inline-flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        {reg.email}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider">
                        <ShieldCheck className="h-3 w-3" />
                        REGISTRAR
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-500 font-mono text-[11px]">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {reg.created_at ? new Date(reg.created_at).toLocaleDateString() : 'Active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <CreateRegistrarModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadRegistrars}
      />
    </div>
  );
};
