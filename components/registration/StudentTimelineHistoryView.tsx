import React, { useState, useEffect } from 'react';
import { Student, Registration, UserRole } from '@/lib/types';
import { fetchStudentWithHistory } from '@/lib/api/supabase-service';
import { StatusBadge } from '../dashboard/StatusBadge';
import {
  User,
  History,
  Building2,
  Calendar,
  Layers,
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  PlusCircle,
} from 'lucide-react';

interface StudentTimelineHistoryViewProps {
  studentIdOrUid: string;
  currentRole: UserRole;
  onBack: () => void;
  onSelectRegistration?: (reg: Registration) => void;
  onReRegister?: (student: Student) => void;
}

export const StudentTimelineHistoryView: React.FC<StudentTimelineHistoryViewProps> = ({
  studentIdOrUid,
  currentRole,
  onBack,
  onSelectRegistration,
  onReRegister,
}) => {
  const [data, setData] = useState<{ student: Student; registrations: Registration[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentWithHistory(studentIdOrUid).then((res) => {
      setData(res);
      setLoading(false);
    });
  }, [studentIdOrUid]);

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-500 animate-pulse">
        Loading candidate history timeline...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs text-center font-semibold">
        Student history record not found for query ({studentIdOrUid}).
      </div>
    );
  }

  const { student, registrations } = data;

  // Calculate course duration and identify extended/backlog registrations
  const currentYearNum = new Date().getFullYear();

  return (
    <div className="space-y-6">
      {/* Navigation Header */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Directory
        </button>

        {onReRegister && (
          <button
            onClick={() => onReRegister(student)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Re-Register Candidate</span>
          </button>
        )}
      </div>

      {/* Student Banner Card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
            <User className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-mono text-xs font-bold border border-blue-200">
                UID: {student.permanent_uid}
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                {registrations.length} Linked Registration Cycle{registrations.length !== 1 ? 's' : ''}
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 mt-1">
              {student.first_name} {student.last_name}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {student.email} • {student.phone || 'No Phone Recorded'}
            </p>
          </div>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-blue-600" />
          <h3 className="text-base font-bold text-slate-900">
            Academic Lifetime History Timeline
          </h3>
        </div>

        {registrations.length === 0 ? (
          <div className="p-8 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
            No academic registrations linked to this Permanent UID yet.
          </div>
        ) : (
          <div className="relative pl-6 border-l-2 border-blue-200 space-y-6">
            {registrations.map((reg, idx) => {
              // Parse year duration exception flag
              const startYear = parseInt((reg.academic_year || '2026').split('-')[0], 10);
              const isOverdue = currentYearNum - startYear > 3 && reg.status !== 'APPROVED';

              return (
                <div key={reg.id} className="relative group">
                  {/* Timeline Dot Indicator */}
                  <div className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 bg-white ${
                    reg.status === 'APPROVED' ? 'border-emerald-500' : isOverdue ? 'border-amber-500' : 'border-blue-500'
                  }`} />

                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 hover:border-blue-300 transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-xs text-slate-900">
                          {reg.registration_number}
                        </span>
                        <StatusBadge status={reg.status} size="sm" />
                        {isOverdue && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3 text-amber-600" />
                            Duration Exception (&gt;3 Yrs)
                          </span>
                        )}
                      </div>

                      {onSelectRegistration && (
                        <button
                          onClick={() => onSelectRegistration(reg)}
                          className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          View Full Record Details &rarr;
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                      <div>
                        <span className="block text-slate-400 font-medium">Institution & Department</span>
                        <span className="font-semibold text-slate-800">
                          {reg.institution?.name || 'New India Bible Seminary'}
                        </span>
                        <div className="text-slate-500 text-[11px]">
                          {reg.department?.name || 'Theology'}
                        </div>
                      </div>

                      <div>
                        <span className="block text-slate-400 font-medium">Program Degree</span>
                        <span className="font-semibold text-slate-800">
                          {reg.program?.name || 'Bachelor of Theology'}
                        </span>
                        <div className="text-blue-600 font-medium text-[11px]">
                          {reg.registration_type.replace(/_/g, ' ')}
                        </div>
                      </div>

                      <div>
                        <span className="block text-slate-400 font-medium">Academic Session</span>
                        <span className="font-mono font-bold text-slate-900">
                          {reg.academic_year}
                        </span>
                        <div className="text-slate-400 text-[10px]">
                          Submitted: {reg.submitted_at ? new Date(reg.submitted_at).toLocaleDateString() : 'Draft Mode'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
