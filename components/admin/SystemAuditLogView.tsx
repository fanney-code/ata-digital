import React, { useState } from 'react';
import { AuditLogEntry } from '@/lib/types';
import {
  FileText,
  Search,
  Filter,
  ShieldCheck,
  Clock,
  User,
  ArrowLeft,
  Calendar,
  Layers,
  Unlock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface SystemAuditLogViewProps {
  onBack?: () => void;
}

export const SystemAuditLogView: React.FC<SystemAuditLogViewProps> = ({ onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  // Mock initial audit logs based on system events
  const [logs] = useState<AuditLogEntry[]>([
    {
      id: 'log-101',
      action: 'UNLOCK',
      entity_type: 'REGISTRATION',
      entity_id: 'REG-2026-881920',
      performed_by: 'administrator@institution.edu',
      performed_by_role: 'ADMINISTRATOR',
      details: 'Unlocked approved registration for emergency candidate name correction per official birth certificate.',
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    },
    {
      id: 'log-102',
      action: 'APPROVE',
      entity_type: 'REGISTRATION',
      entity_id: 'REG-2026-556318',
      performed_by: 'administrator@institution.edu',
      performed_by_role: 'ADMINISTRATOR',
      details: 'Registration approved after verifying candidate national identity documents and transcripts.',
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    },
    {
      id: 'log-103',
      action: 'IMPORT',
      entity_type: 'REGISTRATION',
      entity_id: 'EXCEL_BATCH_2026',
      performed_by: 'registrar@institution.edu',
      performed_by_role: 'REGISTRAR',
      details: 'Imported 22 student candidates via Excel Batch Import Processor.',
      timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    },
    {
      id: 'log-104',
      action: 'CORRECTION',
      entity_type: 'REGISTRATION',
      entity_id: 'REG-2026-301928',
      performed_by: 'administrator@institution.edu',
      performed_by_role: 'ADMINISTRATOR',
      details: 'Requested candidate document correction: Clearer scan of Higher Secondary mark sheet required.',
      timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    },
    {
      id: 'log-105',
      action: 'RESUBMIT',
      entity_type: 'REGISTRATION',
      entity_id: 'REG-2026-301928',
      performed_by: 'registrar@institution.edu',
      performed_by_role: 'REGISTRAR',
      details: 'Resubmitted registration with updated high-resolution mobile camera snapshot.',
      timestamp: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    },
  ]);

  const filteredLogs = logs.filter((log) => {
    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      log.entity_id.toLowerCase().includes(q) ||
      log.performed_by.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q);

    return matchesAction && matchesSearch;
  });

  const getActionBadge = (action: AuditLogEntry['action']) => {
    switch (action) {
      case 'UNLOCK':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px] border border-amber-300 flex items-center gap-1">
            <Unlock className="h-3 w-3 text-amber-500" /> UNLOCKED RECORD
          </span>
        );
      case 'APPROVE':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-300 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" /> APPROVED
          </span>
        );
      case 'CORRECTION':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold text-[10px] border border-rose-300 flex items-center gap-1">
            <AlertCircle className="h-3 w-3 text-rose-500" /> CORRECTION REQUESTED
          </span>
        );
      case 'IMPORT':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-300 flex items-center gap-1">
            <Layers className="h-3 w-3 text-blue-500" /> BATCH EXCEL IMPORT
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] border border-slate-300">
            {action}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 mr-1"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div className="p-2 rounded-xl bg-slate-900 text-white shadow-xs">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              System Audit Trail & Event Logs
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-xs font-bold border border-slate-300">
              {logs.length} Immutable Logs
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1.5 max-w-2xl">
            Complete system activity tracking recording every Create, Submit, Correction, Resubmit, Approve, Unlock, Import, and Status Change event.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full sm:w-80">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search entity ID, user email, audit details..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          >
            <option value="ALL">All Actions</option>
            <option value="UNLOCK">Record Unlocks</option>
            <option value="APPROVE">Approvals</option>
            <option value="CORRECTION">Correction Requests</option>
            <option value="RESUBMIT">Resubmissions</option>
            <option value="IMPORT">Excel Imports</option>
          </select>
        </div>
      </div>

      {/* Logs Table / Cards */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="divide-y divide-slate-100">
          {filteredLogs.map((log) => (
            <div key={log.id} className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  {getActionBadge(log.action)}
                  <span className="font-mono font-extrabold text-xs text-slate-900">
                    {log.entity_id}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{new Date(log.timestamp).toLocaleString()}</span>
                </div>
              </div>

              <p className="text-xs font-medium text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100">
                {log.details}
              </p>

              <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-0.5">
                <span className="flex items-center gap-1 font-mono">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  {log.performed_by} ({log.performed_by_role})
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
