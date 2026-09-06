import React, { useState } from 'react';
import { Registration, WorkflowStatus, UserRole } from '@/lib/types';
import { StatusBadge } from '../dashboard/StatusBadge';
import { Search, Plus, ArrowRight, FileCheck2, Filter } from 'lucide-react';

interface RegistrationListProps {
  registrations: Registration[];
  currentRole: UserRole;
  onSelectRegistration: (reg: Registration) => void;
  onNewRegistration: () => void;
  externalSearchQuery?: string;
  onSearchQueryChange?: (q: string) => void;
}

export const RegistrationList: React.FC<RegistrationListProps> = ({
  registrations,
  currentRole,
  onSelectRegistration,
  onNewRegistration,
  externalSearchQuery,
  onSearchQueryChange,
}) => {
  const [activeTab, setActiveTab] = useState<WorkflowStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState(externalSearchQuery || '');

  React.useEffect(() => {
    if (externalSearchQuery !== undefined) {
      setSearchQuery(externalSearchQuery);
    }
  }, [externalSearchQuery]);

  const filteredRegistrations = registrations.filter((reg) => {
    // Tab status filter
    if (activeTab !== 'ALL' && reg.status !== activeTab) return false;

    // Text Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchNum = reg.registration_number.toLowerCase().includes(q);
      const matchType = reg.registration_type.toLowerCase().includes(q);
      const matchInst = reg.institution?.name.toLowerCase().includes(q);
      const matchStudentName = reg.student
        ? `${reg.student.first_name} ${reg.student.last_name}`.toLowerCase().includes(q)
        : false;
      const matchUid = reg.student?.permanent_uid.toLowerCase().includes(q);

      return matchNum || matchType || matchInst || matchStudentName || matchUid;
    }

    return true;
  });

  const tabs: Array<{ status: WorkflowStatus | 'ALL'; label: string }> = [
    { status: 'ALL', label: 'All Registrations' },
    { status: 'SUBMITTED', label: 'Submitted' },
    { status: 'UNDER_REVIEW', label: 'Under Review' },
    { status: 'CORRECTION_REQUIRED', label: 'Correction Required' },
    { status: 'RESUBMITTED', label: 'Resubmitted' },
    { status: 'APPROVED', label: 'Approved' },
    { status: 'DRAFT', label: 'Draft' },
    { status: 'ARCHIVED', label: 'Archived' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Container */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <FileCheck2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Registrations Management
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Complete candidate registration registry & lifecycle records
            </p>
          </div>
        </div>

        {currentRole === 'REGISTRAR' && (
          <button
            onClick={onNewRegistration}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition-all transform hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" />
            NEW REGISTRATION
          </button>
        )}
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (onSearchQueryChange) onSearchQueryChange(e.target.value);
              }}
              placeholder="Search Reg #, Student UID, Name..."
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Showing <span className="font-bold text-slate-900 dark:text-slate-100">{filteredRegistrations.length}</span> of {registrations.length} records
          </div>
        </div>

        {/* Tab Badges */}
        <div className="flex items-center gap-1.5 p-3 bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 overflow-x-auto">
          <Filter className="h-4 w-4 text-slate-400 shrink-0 ml-2 mr-1" />
          {tabs.map((tab) => {
            const count =
              tab.status === 'ALL'
                ? registrations.length
                : registrations.filter((r) => r.status === tab.status).length;
            const isSelected = activeTab === tab.status;

            return (
              <button
                key={tab.status}
                onClick={() => setActiveTab(tab.status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    isSelected
                      ? 'bg-blue-700 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Table View */}
        {filteredRegistrations.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              No registration records found
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Try adjusting your search criteria or selecting a different status filter tab.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Reg Number</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Registration Type</th>
                  <th className="py-3 px-4">Institution</th>
                  <th className="py-3 px-4">Academic Year</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredRegistrations.map((reg) => {
                  const startYear = parseInt((reg.academic_year || '2026').split('-')[0], 10);
                  const isOverdue = new Date().getFullYear() - startYear > 3 && reg.status !== 'APPROVED';

                  return (
                    <tr
                      key={reg.id}
                      onClick={() => onSelectRegistration(reg)}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer ${
                        isOverdue ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {reg.registration_number}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {reg.student ? `${reg.student.first_name} ${reg.student.last_name}` : 'Candidate Record'}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {reg.student?.permanent_uid}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">
                        {reg.registration_type.replace(/_/g, ' ')}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                        {reg.institution?.name || 'Institution'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-mono">
                        {reg.academic_year}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          <StatusBadge status={reg.status} size="sm" />
                          {isOverdue && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              Duration Exception (&gt;3 Yrs)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectRegistration(reg);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 font-semibold text-xs transition-colors"
                        >
                          View Details
                          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
