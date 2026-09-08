'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { AuditLog, UserRole } from '@/lib/types';
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  X,
  RefreshCw,
  FileText,
  Database,
  Activity,
} from 'lucide-react';

interface AuditLogViewProps {
  logs: AuditLog[];
  currentRole: UserRole;
  onRefresh?: () => void;
  error?: string | null;
}

/* -------------------------------------------------------------------------- */
/* Plain-language mapping for the machine event codes that genuinely exist.   */
/* -------------------------------------------------------------------------- */

type Tone = 'blue' | 'amber' | 'green' | 'red' | 'purple' | 'teal' | 'slate';

interface EventMeta {
  label: string;
  tone: Tone;
}

// Only maps event codes that actually appear in the AuditLog data model.
const EVENT_META: Record<string, EventMeta> = {
  STATUS_CHANGE: { label: 'Status changed', tone: 'blue' },
  STATUS_CHANGED: { label: 'Status changed', tone: 'blue' },
  REGISTRATION_CREATED: { label: 'Registration created', tone: 'blue' },
  CONTROLLED_UNLOCK: { label: 'Record unlocked', tone: 'amber' },
  APPROVAL: { label: 'Dossier approved', tone: 'green' },
  DOSSIER_APPROVED: { label: 'Dossier approved', tone: 'green' },
  CORRECTION_FLAGGED: { label: 'Correction flagged', tone: 'red' },
  EXCEL_BATCH_IMPORT: { label: 'Batch imported', tone: 'purple' },
  DOCUMENT_CAPTURED: { label: 'Document uploaded', tone: 'teal' },
  DOCUMENT_DELETED: { label: 'Document removed', tone: 'red' },
};

function humanizeCode(code: string): string {
  return code
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());
}

function getEventMeta(action: string): EventMeta {
  return EVENT_META[action] || { label: humanizeCode(action), tone: 'slate' };
}

// Restrained, semantic badge styles. Meaning is also carried by the label text
// and a leading dot marker, so colour is never the sole signal.
const TONE_BADGE: Record<Tone, string> = {
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  amber: 'bg-amber-50 text-amber-800 border-amber-200',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  red: 'bg-rose-50 text-rose-700 border-rose-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  teal: 'bg-teal-50 text-teal-800 border-teal-200',
  slate: 'bg-slate-100 text-slate-700 border-slate-200',
};

const TONE_DOT: Record<Tone, string> = {
  blue: 'bg-blue-500',
  amber: 'bg-amber-500',
  green: 'bg-emerald-500',
  red: 'bg-rose-500',
  purple: 'bg-purple-500',
  teal: 'bg-teal-600',
  slate: 'bg-slate-400',
};

const TONE_TEXT: Record<Tone, string> = {
  blue: 'text-blue-700',
  amber: 'text-amber-800',
  green: 'text-emerald-700',
  red: 'text-rose-700',
  purple: 'text-purple-700',
  teal: 'text-teal-800',
  slate: 'text-slate-600',
};

/* Real application roles only. */
function normalizeRole(role: UserRole | string): 'Administrator' | 'Registrar' | 'Universal' {
  const r = String(role).toLowerCase();
  if (r.includes('universal')) return 'Universal';
  if (r.includes('registrar')) return 'Registrar';
  return 'Administrator';
}

/* Short outcome line derived from the real status transition, when present. */
function outcomeLine(log: AuditLog): { text: string; tone: Tone } | null {
  const meta = getEventMeta(log.action);
  if (log.mutation_to) {
    return { text: `→ ${humanizeStatus(log.mutation_to)}`, tone: meta.tone };
  }
  switch (log.action) {
    case 'DOCUMENT_CAPTURED':
      return { text: 'Document added', tone: 'teal' };
    case 'DOCUMENT_DELETED':
      return { text: 'Document removed', tone: 'red' };
    case 'DOSSIER_APPROVED':
    case 'APPROVAL':
      return { text: 'Approved', tone: 'green' };
    case 'CORRECTION_FLAGGED':
      return { text: 'Correction requested', tone: 'red' };
    case 'EXCEL_BATCH_IMPORT':
      return { text: 'Records imported', tone: 'purple' };
    default:
      return null;
  }
}

function humanizeStatus(status: string): string {
  return status
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());
}

function formatDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return { date: iso, time: '' };
  return {
    date: d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
  };
}

/* Strip fabricated quoting / crypto noise from free-text details. */
function cleanDetails(details: string): string {
  return (details || '').replace(/^"|"$/g, '').trim();
}

type TabId = 'ALL' | 'STATUS' | 'DOCUMENTS' | 'BATCH';

export const AuditLogView: React.FC<AuditLogViewProps> = ({
  logs,
  onRefresh,
  error = null,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('ALL');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'Administrator' | 'Registrar' | 'Universal'>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [dateRange, setDateRange] = useState<'ALL' | '7' | '30' | '90'>('ALL');
  const [sortOrder, setSortOrder] = useState<'NEWEST' | 'OLDEST'>('NEWEST');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [detailLog, setDetailLog] = useState<AuditLog | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Captured once at mount so relative date-range/summary math stays stable
  // across re-renders (pure during render).
  const [nowMs] = useState(() => Date.now());

  /* Categorisation helpers grounded in real event codes ------------------ */
  const isStatusEvent = useCallback(
    (l: AuditLog) =>
      ['STATUS_CHANGE', 'STATUS_CHANGED', 'APPROVAL', 'DOSSIER_APPROVED', 'CORRECTION_FLAGGED', 'CONTROLLED_UNLOCK', 'REGISTRATION_CREATED'].includes(
        l.action
      ),
    []
  );
  const isDocumentEvent = useCallback(
    (l: AuditLog) => l.action === 'DOCUMENT_CAPTURED' || l.action === 'DOCUMENT_DELETED' || l.entity_type === 'DOCUMENT',
    []
  );
  const isBatchEvent = useCallback((l: AuditLog) => l.action === 'EXCEL_BATCH_IMPORT', []);

  /* Which tabs are supported by the data actually present. --------------- */
  const availableTabs = useMemo(() => {
    const tabs: { id: TabId; label: string; count: number }[] = [
      { id: 'ALL', label: 'All activities', count: logs.length },
    ];
    const statusCount = logs.filter(isStatusEvent).length;
    const docCount = logs.filter(isDocumentEvent).length;
    const batchCount = logs.filter(isBatchEvent).length;
    if (statusCount > 0) tabs.push({ id: 'STATUS', label: 'Status changes', count: statusCount });
    if (docCount > 0) tabs.push({ id: 'DOCUMENTS', label: 'Document uploads', count: docCount });
    if (batchCount > 0) tabs.push({ id: 'BATCH', label: 'Batch imports', count: batchCount });
    return tabs;
  }, [logs, isStatusEvent, isDocumentEvent, isBatchEvent]);

  /* Real event types present in the data, for the type filter. ----------- */
  const availableTypes = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => set.add(l.action));
    return Array.from(set);
  }, [logs]);

  /* Real roles present in the data, for the role filter. ----------------- */
  const availableRoles = useMemo(() => {
    const set = new Set<'Administrator' | 'Registrar' | 'Universal'>();
    logs.forEach((l) => set.add(normalizeRole(l.actor_role)));
    return Array.from(set);
  }, [logs]);

  /* Filtering ------------------------------------------------------------ */
  const filteredLogs = useMemo(() => {
    const now = nowMs;
    const rangeMs = dateRange === 'ALL' ? null : Number(dateRange) * 24 * 60 * 60 * 1000;

    const list = logs.filter((log) => {
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matches =
          log.actor_name.toLowerCase().includes(q) ||
          (log.entity_id || '').toLowerCase().includes(q) ||
          (log.target_name || '').toLowerCase().includes(q) ||
          (log.target_ref || '').toLowerCase().includes(q) ||
          (log.event_number || '').toLowerCase().includes(q) ||
          cleanDetails(log.details).toLowerCase().includes(q);
        if (!matches) return false;
      }

      if (roleFilter !== 'ALL' && normalizeRole(log.actor_role) !== roleFilter) return false;
      if (typeFilter !== 'ALL' && log.action !== typeFilter) return false;

      if (rangeMs !== null) {
        const t = new Date(log.created_at).getTime();
        if (!isNaN(t) && now - t > rangeMs) return false;
      }

      if (activeTab === 'STATUS') return isStatusEvent(log);
      if (activeTab === 'DOCUMENTS') return isDocumentEvent(log);
      if (activeTab === 'BATCH') return isBatchEvent(log);
      return true;
    });

    list.sort((a, b) => {
      const ta = new Date(a.created_at).getTime();
      const tb = new Date(b.created_at).getTime();
      return sortOrder === 'NEWEST' ? tb - ta : ta - tb;
    });
    return list;
  }, [logs, searchQuery, roleFilter, typeFilter, dateRange, activeTab, sortOrder, nowMs, isStatusEvent, isDocumentEvent, isBatchEvent]);

  /* Summary metrics — all derived from real data, last 90 days. ---------- */
  const summary = useMemo(() => {
    const cutoff = nowMs - 90 * 24 * 60 * 60 * 1000;
    const within = logs.filter((l) => {
      const t = new Date(l.created_at).getTime();
      return isNaN(t) ? true : t >= cutoff;
    });
    return {
      total: within.length,
      status: within.filter(isStatusEvent).length,
      documents: within.filter(isDocumentEvent).length,
    };
  }, [logs, nowMs, isStatusEvent, isDocumentEvent]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  // Clamp during render so the page is always valid without an effect.
  const safePage = Math.min(currentPage, totalPages);
  const paginatedLogs = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, safePage, pageSize]);

  // Any filter/search change returns to the first page.
  const resetToFirstPage = useCallback(() => setCurrentPage(1), []);

  const handleRefresh = () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    Promise.resolve(onRefresh()).finally(() => setTimeout(() => setIsRefreshing(false), 500));
  };

  /* Export --------------------------------------------------------------- */
  const handleExportCSV = () => {
    const headers = ['Event ID', 'Date/Time', 'Activity', 'Actor', 'Role', 'Student/Record', 'Registration', 'Previous status', 'New status', 'Reason', 'Details', 'IP address'];
    const rows = filteredLogs.map((l) => [
      l.event_number || l.id,
      l.created_at,
      getEventMeta(l.action).label,
      l.actor_name,
      normalizeRole(l.actor_role),
      l.target_name || l.entity_id || '',
      l.target_ref || '',
      l.mutation_from ? humanizeStatus(l.mutation_from) : '',
      l.mutation_to ? humanizeStatus(l.mutation_to) : '',
      l.audit_reason || l.reason_code || '',
      cleanDetails(l.details),
      l.ip_address || '',
    ]);
    const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map((r) => r.map(escape).join(',')).join('\n');
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `ata_audit_log_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleExportJSON = () => {
    const payload = filteredLogs.map((l) => ({
      event_id: l.event_number || l.id,
      timestamp: l.created_at,
      activity: getEventMeta(l.action).label,
      action_code: l.action,
      actor: l.actor_name,
      role: normalizeRole(l.actor_role),
      student_record: l.target_name || l.entity_id || null,
      registration: l.target_ref || null,
      previous_status: l.mutation_from ? humanizeStatus(l.mutation_from) : null,
      new_status: l.mutation_to ? humanizeStatus(l.mutation_to) : null,
      reason: l.audit_reason || l.reason_code || null,
      details: cleanDetails(l.details),
      ip_address: l.ip_address || null,
    }));
    downloadBlob(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), `ata_audit_log_${new Date().toISOString().slice(0, 10)}.json`);
  };

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const showingStart = filteredLogs.length > 0 ? (safePage - 1) * pageSize + 1 : 0;
  const showingEnd = Math.min(safePage * pageSize, filteredLogs.length);

  return (
    <div className="space-y-6">
      {/* Header ----------------------------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Audit Log</h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Track important changes and actions across registrations, students, documents, and administration.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onRefresh && (
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006f67]"
              aria-label="Refresh audit activity"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006f67]"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={handleExportJSON}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-semibold shadow-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006f67]"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Summary metrics -------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard icon={<Activity className="h-4 w-4" />} label="Total events" value={summary.total} period="Last 90 days" accent="teal" />
        <SummaryCard icon={<FileText className="h-4 w-4" />} label="Status changes" value={summary.status} period="Last 90 days" accent="blue" />
        <SummaryCard icon={<Database className="h-4 w-4" />} label="Document activity" value={summary.documents} period="Last 90 days" accent="slate" />
      </div>

      {/* Activity tabs ---------------------------------------------------- */}
      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Filter activities by category">
        {availableTabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setActiveTab(tab.id);
                resetToFirstPage();
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006f67] ${
                active ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 ${active ? 'text-slate-300' : 'text-slate-400'}`}>{tab.count}</span>
            </button>
          );
        })}
      </div>

      {/* Search + compact filter row -------------------------------------- */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              resetToFirstPage();
            }}
            placeholder="Search student, registration number, actor, or event ID..."
            aria-label="Search audit activity"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006f67] focus:border-[#006f67] shadow-2xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value as typeof roleFilter);
              resetToFirstPage();
            }}
            aria-label="Filter by role"
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006f67] cursor-pointer"
          >
            <option value="ALL">All roles</option>
            {availableRoles.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              resetToFirstPage();
            }}
            aria-label="Filter by activity type"
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006f67] cursor-pointer"
          >
            <option value="ALL">All activity types</option>
            {availableTypes.map((t) => (
              <option key={t} value={t}>{getEventMeta(t).label}</option>
            ))}
          </select>

          <select
            value={dateRange}
            onChange={(e) => {
              setDateRange(e.target.value as typeof dateRange);
              resetToFirstPage();
            }}
            aria-label="Filter by date range"
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006f67] cursor-pointer"
          >
            <option value="ALL">Date range: All time</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>

          <select
            value={sortOrder}
            onChange={(e) => {
              setSortOrder(e.target.value as typeof sortOrder);
              resetToFirstPage();
            }}
            aria-label="Sort order"
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006f67] cursor-pointer"
          >
            <option value="NEWEST">Newest first</option>
            <option value="OLDEST">Oldest first</option>
          </select>
        </div>
      </div>

      {/* Content: error / empty / table + cards --------------------------- */}
      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-8 text-center">
          <p className="text-sm font-semibold text-rose-800">Unable to load audit activity. Please try again.</p>
          {onRefresh && (
            <button
              type="button"
              onClick={handleRefresh}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Try again
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th scope="col" className="py-3 px-4">Date &amp; time</th>
                  <th scope="col" className="py-3 px-4">Activity</th>
                  <th scope="col" className="py-3 px-4">Actor</th>
                  <th scope="col" className="py-3 px-4">Student / record</th>
                  <th scope="col" className="py-3 px-4">Action</th>
                  <th scope="col" className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-14 text-center">
                      <p className="text-sm font-semibold text-slate-700">No audit activity found</p>
                      <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filters.</p>
                    </td>
                  </tr>
                ) : (
                  paginatedLogs.map((log) => {
                    const meta = getEventMeta(log.action);
                    const { date, time } = formatDateTime(log.created_at);
                    const outcome = outcomeLine(log);
                    const role = normalizeRole(log.actor_role);
                    return (
                      <tr key={log.id} className="hover:bg-slate-50/70 transition-colors align-top">
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-900">{date}</div>
                          <div className="text-slate-400">{time}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${TONE_BADGE[meta.tone]}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${TONE_DOT[meta.tone]}`} aria-hidden="true" />
                            {meta.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{log.actor_name}</div>
                          <div className="text-slate-500">{role}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{log.target_name || '—'}</div>
                          {log.target_ref && <div className="font-mono text-[10.5px] text-slate-500">{log.target_ref}</div>}
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <p className="text-slate-600 leading-relaxed line-clamp-2">{cleanDetails(log.details) || meta.label + '.'}</p>
                          {outcome && (
                            <span className={`mt-1 inline-flex items-center gap-1 text-[11px] font-semibold ${TONE_TEXT[outcome.tone]}`}>
                              {outcome.text}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setDetailLog(log)}
                            className="inline-flex items-center px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006f67]"
                            aria-label={`View details for ${meta.label} by ${log.actor_name}`}
                          >
                            View details
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-slate-100">
            {paginatedLogs.length === 0 ? (
              <div className="py-14 text-center">
                <p className="text-sm font-semibold text-slate-700">No audit activity found</p>
                <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filters.</p>
              </div>
            ) : (
              paginatedLogs.map((log) => {
                const meta = getEventMeta(log.action);
                const { date, time } = formatDateTime(log.created_at);
                const role = normalizeRole(log.actor_role);
                return (
                  <button
                    key={log.id}
                    type="button"
                    onClick={() => setDetailLog(log)}
                    className="w-full text-left p-4 hover:bg-slate-50/70 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006f67] focus-visible:ring-inset"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${TONE_BADGE[meta.tone]}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${TONE_DOT[meta.tone]}`} aria-hidden="true" />
                        {meta.label}
                      </span>
                      <span className="text-[11px] text-slate-400 whitespace-nowrap">{date} · {time}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed mt-2 line-clamp-2">{cleanDetails(log.details) || meta.label + '.'}</p>
                    <div className="flex items-center justify-between mt-2 text-[11px]">
                      <span className="font-semibold text-slate-900">{log.actor_name} <span className="font-normal text-slate-500">· {role}</span></span>
                      {log.target_name && <span className="text-slate-500 truncate ml-2">{log.target_name}</span>}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-slate-50/60 border-t border-slate-100 text-xs text-slate-500">
            <div className="flex items-center gap-3">
              <span>
                Showing {showingStart}–{showingEnd} of {filteredLogs.length} events
              </span>
              <span className="hidden sm:inline text-slate-300">|</span>
              <label className="hidden sm:flex items-center gap-1.5">
                <span>Rows:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    resetToFirstPage();
                  }}
                  aria-label="Rows per page"
                  className="bg-white border border-slate-200 rounded-md px-1.5 py-0.5 font-semibold text-slate-700 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006f67]"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </label>
            </div>

            <div className="flex items-center gap-1 self-end sm:self-auto">
              <button
                type="button"
                disabled={safePage === 1}
                onClick={() => setCurrentPage(Math.max(1, safePage - 1))}
                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006f67]"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Prev</span>
              </button>
              <span className="px-2 font-semibold text-slate-700" aria-live="polite">
                Page {safePage} of {totalPages}
              </span>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage(Math.min(totalPages, safePage + 1))}
                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006f67]"
                aria-label="Next page"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details drawer --------------------------------------------------- */}
      {detailLog && <AuditDetailDrawer log={detailLog} onClose={() => setDetailLog(null)} />}
    </div>
  );
};

/* -------------------------------------------------------------------------- */

interface SummaryCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  period: string;
  accent: 'teal' | 'blue' | 'slate';
}

const SummaryCard: React.FC<SummaryCardProps> = ({ icon, label, value, period, accent }) => {
  const accentBg = accent === 'teal' ? 'bg-teal-50 text-[#006f67]' : accent === 'blue' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600';
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</span>
        <span className={`h-7 w-7 rounded-lg flex items-center justify-center ${accentBg}`}>{icon}</span>
      </div>
      <div className="mt-2 text-2xl font-bold text-slate-900">{value.toLocaleString()}</div>
      <div className="text-[11px] text-slate-400 mt-0.5">{period}</div>
    </div>
  );
};

/* Accessible right-side details drawer. ----------------------------------- */
const AuditDetailDrawer: React.FC<{ log: AuditLog; onClose: () => void }> = ({ log, onClose }) => {
  const meta = getEventMeta(log.action);
  const { date, time } = formatDateTime(log.created_at);
  const role = normalizeRole(log.actor_role);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const rows: { label: string; value?: string | null; mono?: boolean }[] = [
    { label: 'Activity', value: meta.label },
    { label: 'Date & time', value: `${date} · ${time}` },
    { label: 'Student', value: log.target_name },
    { label: 'Permanent UID', value: log.entity_type === 'STUDENT' ? log.entity_id : undefined, mono: true },
    { label: 'Registration', value: log.target_ref, mono: true },
    { label: 'Actor', value: log.actor_name },
    { label: 'Role', value: role },
    { label: 'Action', value: meta.label },
    { label: 'Previous status', value: log.mutation_from ? humanizeStatus(log.mutation_from) : undefined },
    { label: 'New status', value: log.mutation_to ? humanizeStatus(log.mutation_to) : undefined },
    { label: 'Reason', value: log.audit_reason || (log.reason_code ? humanizeStatus(log.reason_code) : undefined) },
    { label: 'Event ID', value: log.event_number || log.id, mono: true },
  ];
  const visibleRows = rows.filter((r) => r.value);
  const details = cleanDetails(log.details);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Audit details: ${meta.label}`}
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col overflow-y-auto animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3">
          <div>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${TONE_BADGE[meta.tone]}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${TONE_DOT[meta.tone]}`} aria-hidden="true" />
              {meta.label}
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-2">Activity details</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            autoFocus
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006f67]"
            aria-label="Close details"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 flex-1 text-xs">
          {details && (
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70">
              <p className="text-slate-700 leading-relaxed">{details}</p>
            </div>
          )}

          <dl className="divide-y divide-slate-100 rounded-lg border border-slate-200/70 overflow-hidden">
            {visibleRows.map((r) => (
              <div key={r.label} className="flex justify-between items-start gap-3 px-3.5 py-2.5">
                <dt className="text-slate-500 font-medium shrink-0">{r.label}</dt>
                <dd className={`text-right text-slate-900 font-semibold ${r.mono ? 'font-mono text-[11px]' : ''}`}>{r.value}</dd>
              </div>
            ))}
          </dl>

          {/* Secondary technical detail — only shown if genuinely stored. */}
          {log.ip_address && (
            <details className="rounded-lg border border-slate-200/70 bg-white">
              <summary className="px-3.5 py-2.5 text-slate-500 font-medium cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006f67] rounded-lg">
                Technical detail
              </summary>
              <div className="px-3.5 pb-3 pt-1">
                <div className="flex justify-between items-center gap-3">
                  <span className="text-slate-500 font-medium">IP address</span>
                  <span className="font-mono text-[11px] text-slate-800">{log.ip_address}</span>
                </div>
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
};
