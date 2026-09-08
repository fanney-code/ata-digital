'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole, DashboardMetrics, Registration, WorkflowStatus } from '@/lib/types';
import { useAuth } from '@/lib/context/AuthContext';
import { PortalLayout } from '@/components/shell/PortalLayout';
import { UniversalDashboard } from '@/components/dashboard/UniversalDashboard';
import { AdministratorDashboard } from '@/components/dashboard/AdministratorDashboard';
import { RegistrarDashboard } from '@/components/dashboard/RegistrarDashboard';
import { RegistrationDetailView } from '@/components/registration/RegistrationDetailView';
import { NewRegistrationWizard } from '@/components/registration/NewRegistrationWizard';
import { RegistrationList } from '@/components/registration/RegistrationList';
import { ManageRegistrarsView } from '@/components/admin/ManageRegistrarsView';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorAlert } from '@/components/ui/ErrorAlert';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [currentRole, setCurrentRole] = useState<UserRole>('REGISTRAR');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Active View State
  const [activeView, setActiveView] = useState<'DASHBOARD' | 'DETAIL' | 'NEW' | 'LIST' | 'MANAGE_REGISTRARS'>('DASHBOARD');
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);

  // Sync role only from server-verified user
  useEffect(() => {
    if (user?.role) {
      setCurrentRole(user.role);
    }
  }, [user]);

  const loadData = useCallback(async () => {
    // Guard: never fetch protected data before auth resolves
    if (authLoading || !user) return;
    setLoading(true);
    setError(null);
    try {
      // All data fetching goes through the BFF — actorContext is built server-side
      const res = await fetch('/api/dashboard', { credentials: 'include' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to fetch dashboard data');
      }
      const data = await res.json();
      setMetrics(data.metrics);
      setRegistrations(data.registrations);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        // Not authenticated — redirect to login
        router.push('/login');
        return;
      }
      loadData();
    }
  }, [authLoading, user, loadData, router]);

  // Handle select registration to view detail
  const handleSelectRegistration = (reg: Registration) => {
    setSelectedRegistration(reg);
    setActiveView('DETAIL');
  };

  // Handle workflow status update — goes through BFF, never direct Supabase
  const handleUpdateStatus = async (id: string, status: WorkflowStatus, notes?: string) => {
    try {
      const res = await fetch(`/api/registrations/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update status');
      }
      const data = await res.json();
      setSelectedRegistration(data.registration);
      await loadData();
    } catch (err: any) {
      alert(`Error updating registration: ${err.message}`);
    }
  };

  const handleNewRegistrationSuccess = async (newReg: Registration) => {
    setSelectedRegistration(newReg);
    setActiveView('DETAIL');
    await loadData();
  };

  const filteredRegistrations = React.useMemo(() => {
    if (!searchQuery.trim()) return registrations;
    const q = searchQuery.toLowerCase().trim();
    return registrations.filter((r) => {
      const stuName = r.student
        ? `${r.student.first_name} ${r.student.last_name}`.toLowerCase()
        : '';
      const uid = (r.student?.permanent_uid || '').toLowerCase();
      const email = (r.student?.email || '').toLowerCase();
      const regNum = r.registration_number.toLowerCase();
      const inst = (r.institution?.name || '').toLowerCase();
      const prog = (r.program?.name || '').toLowerCase();

      return (
        stuName.includes(q) ||
        uid.includes(q) ||
        email.includes(q) ||
        regNum.includes(q) ||
        inst.includes(q) ||
        prog.includes(q)
      );
    });
  }, [registrations, searchQuery]);

  // Check URL query on mount for direct registration inspection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('new') === 'true' || params.get('action') === 'new') {
        setActiveView('NEW');
      }
      if (params.get('action') === 'manage_registrars') {
        setActiveView('MANAGE_REGISTRARS');
      }
      const regId = params.get('id') || params.get('reg');
      if (regId && registrations.length > 0) {
        const found = registrations.find((r) => r.id === regId || r.registration_number === regId);
        if (found) {
          setSelectedRegistration(found);
          setActiveView('DETAIL');
        }
      }
      const q = params.get('query');
      if (q) {
        setSearchQuery(q);
      }
    }
  }, [registrations]);

  // Show skeleton during auth resolution OR data loading
  if (authLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <PortalLayout
      currentRole={currentRole}
      onRoleChange={setCurrentRole}
      onManageRegistrars={() => setActiveView('MANAGE_REGISTRARS')}
      onSelectRegistration={handleSelectRegistration}
      title={
        activeView === 'NEW'
          ? 'New Registration'
          : activeView === 'DETAIL'
          ? `Registration ${selectedRegistration?.registration_number || ''}`
          : activeView === 'LIST'
          ? 'Registrations Registry'
          : activeView === 'MANAGE_REGISTRARS'
          ? 'Manage Registrars'
          : 'Dashboard'
      }
    >
      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorAlert message={error} onRetry={loadData} />
      ) : activeView === 'NEW' ? (
        <NewRegistrationWizard
          onCancel={() => setActiveView('DASHBOARD')}
          onSuccess={handleNewRegistrationSuccess}
        />
      ) : activeView === 'MANAGE_REGISTRARS' ? (
        <ManageRegistrarsView />
      ) : activeView === 'DETAIL' && selectedRegistration ? (
        <RegistrationDetailView
          registration={selectedRegistration}
          currentRole={currentRole}
          onBack={() => {
            setActiveView('DASHBOARD');
            setSelectedRegistration(null);
          }}
          onUpdateStatus={handleUpdateStatus}
        />
      ) : activeView === 'LIST' ? (
        <RegistrationList
          registrations={filteredRegistrations}
          currentRole={currentRole}
          onSelectRegistration={handleSelectRegistration}
          onNewRegistration={() => setActiveView('NEW')}
        />
      ) : metrics ? (
        <>
          {currentRole === 'UNIVERSAL' && (
            <UniversalDashboard
              metrics={metrics}
              registrations={filteredRegistrations}
              onSelectRegistration={handleSelectRegistration}
              onNewRegistration={() => setActiveView('NEW')}
              onManageRegistrars={() => setActiveView('MANAGE_REGISTRARS')}
            />
          )}

          {currentRole === 'ADMINISTRATOR' && (
            <AdministratorDashboard
              metrics={metrics}
              registrations={filteredRegistrations}
              onSelectRegistration={handleSelectRegistration}
              onViewAllRegistrations={() => router.push('/registrations')}
              searchQuery={searchQuery}
            />
          )}

          {currentRole === 'REGISTRAR' && (
            <RegistrarDashboard
              metrics={metrics}
              registrations={filteredRegistrations}
              onNewRegistration={() => setActiveView('NEW')}
              onSelectRegistration={handleSelectRegistration}
              onViewAllRegistrations={() => router.push('/registrations')}
              searchQuery={searchQuery}
            />
          )}
        </>
      ) : null}
    </PortalLayout>
  );
}
