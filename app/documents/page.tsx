'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { UserRole, Registration } from '@/lib/types';
import { useAuth } from '@/lib/context/AuthContext';
import { PortalLayout } from '@/components/shell/PortalLayout';
import { DocumentVaultView } from '@/components/documents/DocumentVaultView';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorAlert } from '@/components/ui/ErrorAlert';

export default function DocumentsPage() {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<UserRole>('ADMINISTRATOR');
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role) {
      setRole(user.role);
    }
  }, [user]);

  const loadData = useCallback(async (isSilent = false) => {
    if (authLoading || !user) return;
    if (!isSilent) setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/documents', { credentials: 'include' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to fetch vault document records');
      }
      const data = await res.json();
      setRegistrations(data.registrations);
    } catch (err: any) {
      if (!isSilent) setError(err.message || 'Failed to fetch vault document records');
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [authLoading, loadData]);

  /**
   * Document upload is handled directly inside DocumentVaultView so it can
   * capture the real server-assigned document ID for preview/download.
   * This callback is called after the upload completes to keep the
   * registrations list in sync.
   */
  const handleUploadDocument = async (_file: File, _registrationId?: string) => {
    await loadData(true);
  };


  const handleDeleteDocument = async (docId: string) => {
    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Delete failed');
      }
      await loadData(true);
    } catch (err: any) {
      console.warn('Document delete error:', err.message);
      throw err;
    }
  };

  const handleSelectRegistration = (reg: Registration) => {
    if (typeof window !== 'undefined') {
      window.location.href = `/dashboard?reg=${encodeURIComponent(reg.id)}`;
    }
  };

  if (authLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <PortalLayout
      currentRole={role}
      onRoleChange={setRole}
      title="Document Locker"
    >
      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorAlert message={error} onRetry={loadData} />
      ) : (
        <DocumentVaultView
          registrations={registrations}
          currentRole={role}
          onSelectRegistration={handleSelectRegistration}
          onUploadDocument={handleUploadDocument}
          onDeleteDocument={handleDeleteDocument}
          onRefresh={() => loadData(true)}
        />
      )}
    </PortalLayout>
  );
}
