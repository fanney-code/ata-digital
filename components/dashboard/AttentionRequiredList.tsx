import React from 'react';
import { Registration } from '@/lib/types';
import { StatusBadge } from './StatusBadge';
import { AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';

interface AttentionRequiredListProps {
  registrations: Registration[];
  onSelectRegistration: (reg: Registration) => void;
  onViewAll?: () => void;
}

export const AttentionRequiredList: React.FC<AttentionRequiredListProps> = ({
  registrations,
  onSelectRegistration,
  onViewAll,
}) => {
  const pendingRegs = registrations.filter(
    (r) => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW' || r.status === 'RESUBMITTED'
  );

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-rose-500" />
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Administrative Attention Required
          </h3>
        </div>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
          >
            View All Registrations
          </button>
        )}
      </div>

      {/* Table Content */}
      {pendingRegs.length === 0 ? (
        <div className="p-8 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500 mb-2" />
          <h4 className="text-xs font-semibold text-slate-800">
            You're all caught up!
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            No registrations currently require administrative attention.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-semibold text-[11px]">
                <th className="py-3 px-5">Reg #</th>
                <th className="py-3 px-5">Student Name</th>
                <th className="py-3 px-5">Type</th>
                <th className="py-3 px-5">Institution</th>
                <th className="py-3 px-5 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pendingRegs.map((reg) => (
                <tr
                  key={reg.id}
                  onClick={() => onSelectRegistration(reg)}
                  className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                >
                  <td className="py-4 px-5 font-mono font-bold text-slate-800">
                    {reg.registration_number}
                  </td>
                  <td className="py-4 px-5">
                    <div className="font-semibold text-slate-900">
                      {reg.student ? `${reg.student.first_name} ${reg.student.last_name}` : 'Student Record'}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {reg.academic_year}
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <div className="space-y-1">
                      <StatusBadge status={reg.status} size="sm" />
                      <div className="text-[10px] text-slate-500 font-medium">
                        {reg.registration_type.replace(/_/g, ' ')}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-5 text-slate-600 font-medium">
                    {reg.institution?.name || 'Institution'}
                  </td>
                  <td className="py-4 px-5 text-right">
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
