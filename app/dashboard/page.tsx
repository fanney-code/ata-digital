'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { UserRole, DashboardMetrics, Registration, WorkflowStatus } from '@/lib/types';
import { useAuth } from '@/lib/context/AuthContext';
import {
  fetchDashboardMetrics,
  fetchRegistrations,
  updateRegistrationStatus,
} from '@/lib/api/supabase-service';
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
  const { user } = useAuth();
  const [currentRole, setCurrentRole] = useState<UserRole>(user?.role || 'REGISTRAR');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Active View State
  const [activeView, setActiveView] = useState<'DASHBOARD' | 'DETAIL' | 'NEW' | 'LIST' | 'MANAGE_REGISTRARS'>('DASHBOARD');
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);

  // Sync role when user changes
  useEffect(() => {
    if (user?.role) {
      setCurrentRole(user.role);
    }
  }, [user]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [m, regs] = await Promise.all([
        fetchDashboardMetrics(),
        fetchRegistrations(),
      ]);
      setMetrics(m);
      setRegistrations(regs);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle select registration to view detail
  const handleSelectRegistration = (reg: Registration) => {
    setSelectedRegistration(reg);
    setActiveView('DETAIL');
  };

  // Handle workflow status update (Approve, Request Correction, Submit, Resubmit)
  const handleUpdateStatus = async (id: string, status: WorkflowStatus, notes?: string) => {
    try {
      const updated = await updateRegistrationStatus(id, status, notes);
      setSelectedRegistration(updated);
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

  return (
    <PortalLayout
      currentRole={currentRole}
      onRoleChange={setCurrentRole}
      onNewRegistration={() => setActiveView('NEW')}
      onManageRegistrars={() => setActiveView('MANAGE_REGISTRARS')}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
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
          registrations={registrations}
          currentRole={currentRole}
          onSelectRegistration={handleSelectRegistration}
          onNewRegistration={() => setActiveView('NEW')}
        />
      ) : metrics ? (
        <>
          {currentRole === 'UNIVERSAL' && (
            <UniversalDashboard
              metrics={metrics}
              registrations={registrations}
              onSelectRegistration={handleSelectRegistration}
            />
          )}

          {currentRole === 'ADMINISTRATOR' && (
            <AdministratorDashboard
              metrics={metrics}
              registrations={registrations}
              onSelectRegistration={handleSelectRegistration}
              onViewAllRegistrations={() => setActiveView('LIST')}
            />
          )}

          {currentRole === 'REGISTRAR' && (
            <RegistrarDashboard
              metrics={metrics}
              registrations={registrations}
              onNewRegistration={() => setActiveView('NEW')}
              onSelectRegistration={handleSelectRegistration}
              onViewAllRegistrations={() => setActiveView('LIST')}
            />
          )}
        </>
      ) : null}
    </PortalLayout>
  );
}
