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

  const [activeView, setActiveView] = useState<'LIST' | 'DETAIL'>('LIST');
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [reRegisterStudent, setReRegisterStudent] = useState<any | null>(null);
  const [isNewRegistrationModalOpen, setIsNewRegistrationModalOpen] = useState(false);

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

  const handleOpenNewRegistration = () => {
    setReRegisterStudent(null);
    setIsNewRegistrationModalOpen(true);
  };

  const handleStartReRegistration = (student: any) => {
    setReRegisterStudent(student);
    setIsNewRegistrationModalOpen(true);
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
    setIsNewRegistrationModalOpen(false);
    setSelectedRegistration(newReg);
    setReRegisterStudent(null);
    setActiveView('DETAIL');
    await loadRegistrations();
  };

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('new') === 'true' || params.get('action') === 'new') {
        setReRegisterStudent(null);
        setIsNewRegistrationModalOpen(true);
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('new');
        newUrl.searchParams.delete('action');
        const searchStr = newUrl.searchParams.toString();
        window.history.replaceState({}, '', newUrl.pathname + (searchStr ? '?' + searchStr : ''));
      }
      const regId = params.get('id');
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

  return (
    <PortalLayout
      currentRole={currentRole}
      onRoleChange={setCurrentRole}
      onSelectRegistration={handleSelectRegistration}
      onNewRegistration={handleOpenNewRegistration}
      title={
        activeView === 'DETAIL'
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
      ) : activeView === 'DETAIL' && selectedRegistration ? (
        <RegistrationDetailView
          registration={selectedRegistration}
          currentRole={currentRole}
          onBack={() => {
            setActiveView('LIST');
            setSelectedRegistration(null);
          }}
          onUpdateStatus={handleUpdateStatus}
          onReRegisterStudent={handleStartReRegistration}
        />
      ) : currentRole === 'REGISTRAR' ? (
        <ManageRegisterView
          registrations={registrations}
          currentRole={currentRole}
          onSelectRegistration={handleSelectRegistration}
          onNewRegistration={handleOpenNewRegistration}
          onReRegisterStudent={handleStartReRegistration}
          onReload={loadRegistrations}
          externalSearchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
        />
      ) : (
        <RegistrationList
          registrations={registrations}
          currentRole={currentRole}
          onSelectRegistration={handleSelectRegistration}
          onNewRegistration={handleOpenNewRegistration}
          externalSearchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
        />
      )}

      {/* New Registration Wizard Modal */}
      {isNewRegistrationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl my-auto max-h-[92vh] overflow-y-auto">
            <NewRegistrationWizard
              initialStudent={reRegisterStudent}
              defaultRegistrationType={reRegisterStudent ? 'RE_REGISTRATION' : 'INITIAL_REGISTRATION'}
              onCancel={() => {
                setIsNewRegistrationModalOpen(false);
                setReRegisterStudent(null);
              }}
              onSuccess={handleNewRegistrationSuccess}
            />
          </div>
        </div>
      )}
    </PortalLayout>
  );
}
