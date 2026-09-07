'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { UserRole, Institution, Department, Program } from '@/lib/types';
import { useAuth } from '@/lib/context/AuthContext';
import { fetchInstitutions, fetchDepartments, fetchPrograms } from '@/lib/api/supabase-service';
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
      const [insts, depts, progs] = await Promise.all([
        fetchInstitutions(),
        fetchDepartments(),
        fetchPrograms(),
      ]);
      setInstitutions(insts);
      setDepartments(depts);
      setPrograms(progs);
    } catch (err: any) {
      setError(err.message || 'Failed to load institutions directory.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <PortalLayout
      currentRole={role}
      onRoleChange={setRole}
      title={
        role === 'UNIVERSAL'
          ? 'Institutions & Curricula Hub'
          : role === 'ADMINISTRATOR'
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
        <InstitutionsAcademicGovernanceView
          institutions={institutions}
          departments={departments}
          programs={programs}
        />
      ) : (
        <InstitutionsDirectoryView
          institutions={institutions}
          departments={departments}
          programs={programs}
        />
      )}
    </PortalLayout>
  );
}
