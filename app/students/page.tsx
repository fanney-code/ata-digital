'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole, Student, Registration, Institution } from '@/lib/types';
import { useAuth } from '@/lib/context/AuthContext';
import { fetchInstitutions } from '@/lib/api/supabase-service';
import { PortalLayout } from '@/components/shell/PortalLayout';
import { StudentTimelineHistoryView } from '@/components/registration/StudentTimelineHistoryView';
import { MasterStudentDirectoryView } from '@/components/admin/MasterStudentDirectoryView';
import { UniversalStudentMasterDirectoryView } from '@/components/students/UniversalStudentMasterDirectoryView';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorAlert } from '@/components/ui/ErrorAlert';

export default function StudentsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<UserRole>('ADMINISTRATOR');
  const [studentParamId, setStudentParamId] = useState<string | null>(null);

  const [students, setStudents] = useState<Student[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role) {
      setRole(user.role);
    }
  }, [user]);

  // Check URL params for direct student selection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const studentId = params.get('id');
      if (studentId) {
        setStudentParamId(studentId);
      }
    }
  }, []);

  const loadData = useCallback(async () => {
    if (authLoading || !user) return;
    setLoading(true);
    setError(null);
    try {
      const [studentsRes, registrationsRes, instData] = await Promise.all([
        fetch('/api/students', { credentials: 'include' }).then(async (r) => {
          if (!r.ok) throw new Error((await r.json()).error || 'Failed to load students');
          return r.json();
        }),
        fetch('/api/registrations', { credentials: 'include' }).then(async (r) => {
          if (!r.ok) throw new Error((await r.json()).error || 'Failed to load registrations');
          return r.json();
        }),
        fetchInstitutions().catch(() => []),
      ]);
      setStudents(studentsRes.students || []);
      setRegistrations(registrationsRes.registrations || []);
      setInstitutions(instData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load student roster data.');
    } finally {
      setLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [authLoading, loadData]);

  if (authLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <PortalLayout
      currentRole={role}
      onRoleChange={setRole}
      title={
        role === 'UNIVERSAL'
          ? 'Student Master Directory'
          : role === 'ADMINISTRATOR'
          ? 'Master Student Directory'
          : 'Student Directory & Lifetime History'
      }
    >
      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorAlert message={error} onRetry={loadData} />
      ) : role === 'UNIVERSAL' && !studentParamId ? (
        <UniversalStudentMasterDirectoryView
          students={students}
          registrations={registrations}
          institutions={institutions}
        />
      ) : role === 'ADMINISTRATOR' && !studentParamId ? (
        <MasterStudentDirectoryView
          students={students}
          registrations={registrations}
          institutions={institutions}
        />
      ) : (
        <StudentTimelineHistoryView
          initialStudentIdOrUid={studentParamId || undefined}
          currentRole={role}
          onBack={
            studentParamId
              ? () => {
                  setStudentParamId(null);
                  router.push('/students');
                }
              : undefined
          }
          onReRegister={(student) => {
            router.push(`/registrations/new?student_id=${student.id}&type=RE_REGISTRATION`);
          }}
        />
      )}
    </PortalLayout>
  );
}
