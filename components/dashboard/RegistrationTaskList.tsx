import React from 'react';
import { Registration } from '@/lib/types';
import { StatusBadge } from './StatusBadge';
import { AlertCircle, FileText, ArrowRight, Building2, Calendar, Layers } from 'lucide-react';

interface RegistrationTaskListProps {
  registrations: Registration[];
  onSelectRegistration: (reg: Registration) => void;
  onViewAll?: () => void;
  searchQuery?: string;
}

export const RegistrationTaskList: React.FC<RegistrationTaskListProps> = ({
  registrations,
  onSelectRegistration,
  onViewAll,
  searchQuery = '',
}) => {
  const isSearching = Boolean(searchQuery && searchQuery.trim());
  const taskRegs = isSearching
    ? registrations
    : registrations.filter(
        (r) => r.status === 'DRAFT' || r.status === 'CORRECTION_REQUIRED' || r.status === 'RESUBMITTED'
      );

  return (
    <div className="space-y-3">
      {/* Section Title */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">
          {isSearching ? `Search Results (${taskRegs.length})` : 'Registrar Tasks'}
        </h3>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
          >
            View All Registrations
          </button>
        )}
      </div>

      {/* Task Cards List */}
      {taskRegs.length === 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-xl p-8 text-center text-xs text-slate-500">
          {isSearching
            ? `No registrations found matching "${searchQuery}".`
            : 'No pending tasks requiring registrar action.'}
        </div>
      ) : (
        <div className="space-y-3">
          {taskRegs.map((reg) => {
            const isAlert = reg.status === 'CORRECTION_REQUIRED';
            return (
              <div
                key={reg.id}
                onClick={() => onSelectRegistration(reg)}
                className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-xl p-4 sm:p-5 shadow-xs transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`p-2.5 rounded-lg shrink-0 mt-0.5 ${
                      isAlert ? 'bg-rose-50 text-rose-500' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {isAlert ? (
                      <AlertCircle className="h-5 w-5" />
                    ) : (
                      <FileText className="h-5 w-5" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-xs text-slate-800">
                        {reg.registration_number}
                      </span>
                      <StatusBadge status={reg.status} size="sm" />
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">
                      {reg.student ? `${reg.student.first_name} ${reg.student.last_name}` : 'Student Record'}
                    </h4>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        {reg.institution?.name || 'Institution'}
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {reg.academic_year}
                      </span>
                      <span className="flex items-center gap-1">
                        <Layers className="h-3.5 w-3.5 text-slate-400" />
                        {reg.registration_type.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end sm:justify-start">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectRegistration(reg);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 group-hover:underline"
                  >
                    View Details
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
