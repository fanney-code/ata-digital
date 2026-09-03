'use client';

import React, { useState, useEffect } from 'react';
import { UserRole, Student } from '@/lib/types';
import { fetchStudents } from '@/lib/api/supabase-service';
import { PortalLayout } from '@/components/shell/PortalLayout';
import { StudentTimelineHistoryView } from '@/components/registration/StudentTimelineHistoryView';
import { Users, Search, Mail, Phone, Calendar, ArrowRight, History } from 'lucide-react';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

export default function StudentsPage() {
  const [role, setRole] = useState<UserRole>('REGISTRAR');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  useEffect(() => {
    fetchStudents(query).then((data) => {
      setStudents(data);
      setLoading(false);
    });
  }, [query]);

  return (
    <PortalLayout
      currentRole={role}
      onRoleChange={setRole}
      title={selectedStudentId ? "Student Lifetime History Timeline" : "Student Directory"}
    >
      {selectedStudentId ? (
        <StudentTimelineHistoryView
          studentIdOrUid={selectedStudentId}
          currentRole={role}
          onBack={() => setSelectedStudentId(null)}
        />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Student Directory
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Centralized registry of verified student candidates & unique UIDs
                </p>
              </div>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search UID, Name, Email..."
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          {loading ? (
            <LoadingSkeleton />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {students.map((st) => (
                <div
                  key={st.id}
                  onClick={() => setSelectedStudentId(st.id)}
                  className="p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3 hover:border-blue-300 transition-colors cursor-pointer group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400">
                        {st.permanent_uid}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5 group-hover:text-blue-600 transition-colors">
                        {st.first_name} {st.last_name}
                      </h3>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                      {st.gender || 'Active Candidate'}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      <span>{st.email}</span>
                    </div>
                    {st.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        <span>{st.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600">
                    <span className="flex items-center gap-1">
                      <History className="h-3.5 w-3.5" />
                      View Lifetime History
                    </span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </PortalLayout>
  );
}
