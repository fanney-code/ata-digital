'use client';

import React, { useState, useEffect } from 'react';
import { UserRole, Institution, Department, Program } from '@/lib/types';
import { fetchInstitutions, fetchDepartments, fetchPrograms } from '@/lib/api/supabase-service';
import { PortalLayout } from '@/components/shell/PortalLayout';
import { Building2, BookOpen, Layers } from 'lucide-react';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

export default function InstitutionsPage() {
  const [role, setRole] = useState<UserRole>('UNIVERSAL');
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchInstitutions(), fetchDepartments(), fetchPrograms()]).then(
      ([insts, depts, progs]) => {
        setInstitutions(insts);
        setDepartments(depts);
        setPrograms(progs);
        setLoading(false);
      }
    );
  }, []);

  return (
    <PortalLayout
      currentRole={role}
      onRoleChange={setRole}
      title="Institutions & Academic Structure"
    >
      <div className="space-y-6">
        <div className="flex items-center gap-3 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Institutional Hierarchy
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Constituent Institutions, Departments, and Degree Programs
            </p>
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton />
        ) : (
          <div className="space-y-6">
            {institutions.map((inst) => {
              const instDepts = departments.filter((d) => d.institution_id === inst.id);

              return (
                <div
                  key={inst.id}
                  className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 font-bold">
                        CODE: {inst.code}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {inst.name}
                      </h3>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 text-xs font-semibold">
                      {instDepts.length} Departments
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {instDepts.map((dept) => {
                      const deptProgs = programs.filter((p) => p.department_id === dept.id);

                      return (
                        <div
                          key={dept.id}
                          className="p-4 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2"
                        >
                          <div className="flex items-center gap-2">
                            <Layers className="h-4 w-4 text-purple-500" />
                            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {dept.name} ({dept.code})
                            </h4>
                          </div>

                          <div className="space-y-1 pl-6">
                            {deptProgs.map((prog) => (
                              <div
                                key={prog.id}
                                className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 py-1 border-b border-slate-200/40 dark:border-slate-700/40 last:border-0"
                              >
                                <span className="flex items-center gap-1.5 font-medium">
                                  <BookOpen className="h-3 w-3 text-slate-400" />
                                  {prog.name}
                                </span>
                                <span className="text-[10px] font-mono font-bold text-slate-500">
                                  {prog.code}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
