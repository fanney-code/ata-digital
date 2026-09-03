'use client';

import React, { useState, useEffect } from 'react';
import { UserRole, AuditLog } from '@/lib/types';
import { fetchAuditLogs } from '@/lib/api/supabase-service';
import { PortalLayout } from '@/components/shell/PortalLayout';
import { ShieldCheck, Search, Filter, Clock, User, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

export default function AuditLogsPage() {
  const [role, setRole] = useState<UserRole>('UNIVERSAL');
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  useEffect(() => {
    fetchAuditLogs().then((data) => {
      setLogs(data);
      setLoading(false);
    });
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      log.actor_name.toLowerCase().includes(q) ||
      log.entity_id.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q);

    return matchesAction && matchesSearch;
  });

  return (
    <PortalLayout
      currentRole={role}
      onRoleChange={setRole}
      title="System Audit Logs & Governance"
    >
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-600 text-white shadow-xs">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                System Audit Logs & Activity Tracking
              </h2>
              <p className="text-xs text-slate-500">
                Immutable action history across student creations, approvals, record unlocks, and batch imports
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search actor, record ID, details..."
                className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
              />
            </div>

            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
            >
              <option value="ALL">All Actions</option>
              <option value="REGISTRATION_CREATED">Registration Created</option>
              <option value="APPROVAL">Approval</option>
              <option value="CONTROLLED_UNLOCK">Controlled Unlock</option>
              <option value="EXCEL_BATCH_IMPORT">Excel Batch Import</option>
              <option value="DOCUMENT_CAPTURED">Document Captured</option>
            </select>
          </div>
        </div>

        {/* Audit Log Table */}
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Showing <strong className="text-slate-900">{filteredLogs.length}</strong> recorded audit events</span>
              <span className="font-mono text-[11px] text-slate-400">Security Audit Scoped (Universal / Admin)</span>
            </div>

            {filteredLogs.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">
                No audit entries match the selected action filter or search query.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold text-[11px]">
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Action Event</th>
                      <th className="py-3 px-4">Actor & Role</th>
                      <th className="py-3 px-4">Target Entity</th>
                      <th className="py-3 px-4">Event Details</th>
                      <th className="py-3 px-4">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-[11px]">
                          <span
                            className={`px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${
                              log.action === 'APPROVAL'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : log.action === 'CONTROLLED_UNLOCK'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : log.action === 'EXCEL_BATCH_IMPORT'
                                ? 'bg-blue-50 text-blue-800 border-blue-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {log.action === 'APPROVAL' && <CheckCircle2 className="h-3 w-3 text-emerald-600" />}
                            {log.action === 'CONTROLLED_UNLOCK' && <ShieldAlert className="h-3 w-3 text-amber-600" />}
                            {log.action.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{log.actor_name}</div>
                          <div className="text-[10px] font-mono text-purple-600">{log.actor_role}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-800 font-bold">
                          {log.entity_id}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-sans text-xs">
                          {log.details}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                          {log.ip_address || '127.0.0.1'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
