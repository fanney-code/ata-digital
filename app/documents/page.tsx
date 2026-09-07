'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { UserRole, Registration } from '@/lib/types';
import { useAuth } from '@/lib/context/AuthContext';
import { PortalLayout } from '@/components/shell/PortalLayout';
import { DocumentVaultView } from '@/components/documents/DocumentVaultView';
import { CentralDocumentVaultView } from '@/components/admin/CentralDocumentVaultView';
import { UniversalDocumentVaultView } from '@/components/documents/UniversalDocumentVaultView';
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

  const loadData = useCallback(async () => {
    if (authLoading || !user) return;
    setLoading(true);
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
      setError(err.message || 'Failed to fetch vault document records');
    } finally {
      setLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [authLoading, loadData]);

  /**
   * Document upload uses multipart FormData sent to the BFF.
   * The BFF verifies institution ownership server-side before uploading.
   * Preserves the existing file upload behavior (File object → Supabase Storage).
   */
  const handleUploadDocument = async (file: File) => {
    const regId = registrations[0]?.id || 'default-reg';
    const formData = new FormData();
    formData.append('file', file);
    formData.append('registrationId', regId);

    const res = await fetch('/api/documents/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Upload failed');
    }
    await loadData();
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
      title={
        role === 'UNIVERSAL'
          ? 'Central Document Locker & Verification Vault'
          : role === 'ADMINISTRATOR'
          ? 'Central Document Locker & Verification Vault'
          : 'Document Locker & Verification Vault'
      }
    >
      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorAlert message={error} onRetry={loadData} />
      ) : role === 'UNIVERSAL' ? (
        <UniversalDocumentVaultView
          registrations={registrations}
          onSelectRegistration={handleSelectRegistration}
          onUploadDocument={handleUploadDocument}
        />
      ) : role === 'ADMINISTRATOR' ? (
        <CentralDocumentVaultView
          registrations={registrations}
          onSelectRegistration={handleSelectRegistration}
          onUploadDocument={handleUploadDocument}
        />
      ) : (
        <DocumentVaultView
          registrations={registrations}
          onSelectRegistration={handleSelectRegistration}
          onUploadDocument={handleUploadDocument}
        />
      )}
    </PortalLayout>
  );
}
