'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { UserRole, Registration, WorkflowStatus } from '@/lib/types';
import { useAuth } from '@/lib/context/AuthContext';
import { PortalLayout } from '@/components/shell/PortalLayout';
import { RegistrationList } from '@/components/registration/RegistrationList';
import { ManageRegisterView } from '@/components/registration/ManageRegisterView';
import { RegistrationsGovernanceDirectoryView } from '@/components/admin/RegistrationsGovernanceDirectoryView';
import { UniversalRegistrationsMasterRegisterView } from '@/components/registration/UniversalRegistrationsMasterRegisterView';
import { RegistrationDetailView } from '@/components/registration/RegistrationDetailView';
import { NewRegistrationWizard } from '@/components/registration/NewRegistrationWizard';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorAlert } from '@/components/ui/ErrorAlert';

export default function RegistrationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [currentRole, setCurrentRole] = useState<UserRole>('ADMINISTRATOR');
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeView, setActiveView] = useState<'LIST' | 'DETAIL' | 'NEW'>('LIST');
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [reRegisterStudent, setReRegisterStudent] = useState<any | null>(null);
  const [isNewRegistrationModalOpen, setIsNewRegistrationModalOpen] = useState(false);

  useEffect(() => {
    if (user?.role) {
      setCurrentRole(user.role);
    }
  }, [user]);

  const loadRegistrations = useCallback(async () => {
    if (authLoading || !user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/registrations', { credentials: 'include' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to load registrations');
      }
      const data = await res.json();
      setRegistrations(data.registrations);
    } catch (err: any) {
      setError(err.message || 'Failed to load registrations');
    } finally {
      setLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!authLoading) {
      loadRegistrations();
    }
  }, [authLoading, loadRegistrations]);

  const handleSelectRegistration = (reg: Registration) => {
    setSelectedRegistration(reg);
    setActiveView('DETAIL');
  };

  const handleOpenNewRegistration = () => {
    setReRegisterStudent(null);
    setActiveView('NEW');
  };

  const handleStartReRegistration = (student: any) => {
    setReRegisterStudent(student);
    setActiveView('NEW');
  };

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
      await loadRegistrations();
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  const handleNewRegistrationSuccess = async (newReg: Registration) => {
    setActiveView('DETAIL');
    setSelectedRegistration(newReg);
    setIsNewRegistrationModalOpen(false);
    setReRegisterStudent(null);
    await loadRegistrations();
  };

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('new') === 'true' || params.get('action') === 'new') {
        setReRegisterStudent(null);
        setActiveView('NEW');
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

  if (authLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <PortalLayout
      currentRole={currentRole}
      onRoleChange={setCurrentRole}
      onSelectRegistration={handleSelectRegistration}
      onNewRegistration={handleOpenNewRegistration}
      title={
        activeView === 'NEW'
          ? 'Institutional Enrollment Wizard'
          : activeView === 'DETAIL'
          ? `Registration ${selectedRegistration?.registration_number || ''}`
          : currentRole === 'UNIVERSAL'
          ? 'Registrations & Master Register'
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
        currentRole === 'REGISTRAR' ? (
          <NewRegistrationWizard
            initialStudent={reRegisterStudent}
            defaultRegistrationType={reRegisterStudent ? 'RE_REGISTRATION' : 'INITIAL_REGISTRATION'}
            onCancel={() => {
              setActiveView('LIST');
              setReRegisterStudent(null);
            }}
            onSuccess={handleNewRegistrationSuccess}
          />
        ) : (
          <div className="p-8 max-w-xl mx-auto text-center space-y-4 bg-white rounded-2xl border border-slate-200 shadow-sm mt-8">
            <h3 className="text-lg font-bold text-slate-900">Enrollment Restricted to Registrar</h3>
            <p className="text-xs text-slate-600">
              Only institutional Registrars are authorized to initiate new candidate matriculation records.
            </p>
            <button
              onClick={() => setActiveView('LIST')}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-black transition-colors"
            >
              Return to Registrations
            </button>
          </div>
        )
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
      ) : currentRole === 'UNIVERSAL' ? (
        <UniversalRegistrationsMasterRegisterView
          registrations={registrations}
          currentRole={currentRole}
          onSelectRegistration={handleSelectRegistration}
          onNewRegistration={handleOpenNewRegistration}
          onReRegisterStudent={handleStartReRegistration}
          onReload={loadRegistrations}
          externalSearchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
        />
      ) : currentRole === 'ADMINISTRATOR' ? (
        <RegistrationsGovernanceDirectoryView
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
      )}

      {/* New Registration Wizard Modal (if triggered externally) */}
      {isNewRegistrationModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsNewRegistrationModalOpen(false);
              setReRegisterStudent(null);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-5xl my-auto max-h-[92vh] overflow-y-auto rounded-3xl">
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
