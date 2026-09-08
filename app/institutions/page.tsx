'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { UserRole, Institution, Department, Program, Registration } from '@/lib/types';
import { useAuth } from '@/lib/context/AuthContext';
import { fetchInstitutions, fetchDepartments, fetchPrograms, fetchRegistrations } from '@/lib/api/supabase-service';
import { PortalLayout } from '@/components/shell/PortalLayout';
import { InstitutionsDirectoryView } from '@/components/institutions/InstitutionsDirectoryView';
import { InstitutionsAcademicGovernanceView } from '@/components/admin/InstitutionsAcademicGovernanceView';
import { UniversalInstitutionsGovernanceHub } from '@/components/institutions/UniversalInstitutionsGovernanceHub';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorAlert } from '@/components/ui/ErrorAlert';

export default function InstitutionsPage() {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>(user?.role || 'ADMINISTRATOR');
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role) {
      setRole(user.role);
    }
  }, [user]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [insts, depts, progs, regs] = await Promise.all([
        fetchInstitutions(),
        fetchDepartments(),
        fetchPrograms(),
        fetchRegistrations(),
      ]);
      setInstitutions(insts);
      setDepartments(depts);
      setPrograms(progs);
      setRegistrations(regs);
    } catch (err: any) {
      setError(err.message || 'Failed to load institutions directory.');
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    loadData();
  }, [loadData]);

  const [adminViewTab, setAdminViewTab] = useState<'DIRECTORY' | 'GOVERNANCE'>('DIRECTORY');

  return (
    <PortalLayout
      currentRole={role}
      onRoleChange={setRole}
      title={
        role === 'UNIVERSAL'
          ? 'Institutions & Curricula Hub'
          : role === 'ADMINISTRATOR' && adminViewTab === 'GOVERNANCE'
          ? 'Institutions & Academic Governance'
          : 'Institutions & Degree Programs'
      }
    >
      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorAlert message={error} onRetry={loadData} />
      ) : role === 'UNIVERSAL' ? (
        <UniversalInstitutionsGovernanceHub
          institutions={institutions}
          departments={departments}
          programs={programs}
        />
      ) : role === 'ADMINISTRATOR' ? (
        <div className="space-y-6">
          {/* Admin Sub-View Switcher */}
          <div className="flex items-center gap-2 p-1 bg-slate-100/80 rounded-xl w-fit border border-slate-200/80 text-xs">
            <button
              type="button"
              onClick={() => setAdminViewTab('DIRECTORY')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                adminViewTab === 'DIRECTORY'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Institutions &amp; Degree Programs
            </button>
            <button
              type="button"
              onClick={() => setAdminViewTab('GOVERNANCE')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                adminViewTab === 'GOVERNANCE'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Academic Governance Hub
            </button>
          </div>

          {adminViewTab === 'DIRECTORY' ? (
            <InstitutionsDirectoryView
              institutions={institutions}
              departments={departments}
              programs={programs}
              registrations={registrations}
            />
          ) : (
            <InstitutionsAcademicGovernanceView
              institutions={institutions}
              departments={departments}
              programs={programs}
            />
          )}
        </div>
      ) : (
        <InstitutionsDirectoryView
          institutions={institutions}
          departments={departments}
          programs={programs}
          registrations={registrations}
        />
      )}
    </PortalLayout>

  );
}
