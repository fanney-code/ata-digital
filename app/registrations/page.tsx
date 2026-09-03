'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { UserRole, Registration, WorkflowStatus } from '@/lib/types';
import { useAuth } from '@/lib/context/AuthContext';
import { fetchRegistrations, updateRegistrationStatus } from '@/lib/api/supabase-service';
import { PortalLayout } from '@/components/shell/PortalLayout';
import { RegistrationList } from '@/components/registration/RegistrationList';
import { ManageRegisterView } from '@/components/registration/ManageRegisterView';
import { RegistrationDetailView } from '@/components/registration/RegistrationDetailView';
import { NewRegistrationWizard } from '@/components/registration/NewRegistrationWizard';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorAlert } from '@/components/ui/ErrorAlert';

export default function RegistrationsPage() {
  const { user } = useAuth();
  const [currentRole, setCurrentRole] = useState<UserRole>(user?.role || 'REGISTRAR');
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeView, setActiveView] = useState<'LIST' | 'DETAIL' | 'NEW'>('LIST');
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);

  useEffect(() => {
    if (user?.role) {
      setCurrentRole(user.role);
    }
  }, [user]);

  const loadRegistrations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRegistrations();
      setRegistrations(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load registrations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRegistrations();
  }, [loadRegistrations]);

  const handleSelectRegistration = (reg: Registration) => {
    setSelectedRegistration(reg);
    setActiveView('DETAIL');
  };

  const handleUpdateStatus = async (id: string, status: WorkflowStatus, notes?: string) => {
    try {
      const updated = await updateRegistrationStatus(id, status, notes);
      setSelectedRegistration(updated);
      await loadRegistrations();
    } catch (err: any) {
      alert(`Error updating registration: ${err.message}`);
    }
  };

  const handleNewRegistrationSuccess = async (newReg: Registration) => {
    setSelectedRegistration(newReg);
    setActiveView('DETAIL');
    await loadRegistrations();
  };

  return (
    <PortalLayout
      currentRole={currentRole}
      onRoleChange={setCurrentRole}
      onNewRegistration={() => setActiveView('NEW')}
      title={
        activeView === 'NEW'
          ? 'New Registration'
          : activeView === 'DETAIL'
          ? `Registration ${selectedRegistration?.registration_number || ''}`
          : currentRole === 'REGISTRAR'
          ? 'Manage Register'
          : 'Registrations Directory'
      }
    >
      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorAlert message={error} onRetry={loadRegistrations} />
      ) : activeView === 'NEW' ? (
        <NewRegistrationWizard
          onCancel={() => setActiveView('LIST')}
          onSuccess={handleNewRegistrationSuccess}
        />
      ) : activeView === 'DETAIL' && selectedRegistration ? (
        <RegistrationDetailView
          registration={selectedRegistration}
          currentRole={currentRole}
          onBack={() => {
            setActiveView('LIST');
            setSelectedRegistration(null);
          }}
          onUpdateStatus={handleUpdateStatus}
        />
      ) : currentRole === 'REGISTRAR' ? (
        <ManageRegisterView
          registrations={registrations}
          currentRole={currentRole}
          onSelectRegistration={handleSelectRegistration}
          onNewRegistration={() => setActiveView('NEW')}
          onReload={loadRegistrations}
        />
      ) : (
        <RegistrationList
          registrations={registrations}
          currentRole={currentRole}
          onSelectRegistration={handleSelectRegistration}
          onNewRegistration={() => setActiveView('NEW')}
        />
      )}
    </PortalLayout>
  );
}
