'use client';

import React, { useState, useEffect } from 'react';
import { UserRole, AuditLog } from '@/lib/types';
import { useAuth } from '@/lib/context/AuthContext';
import { fetchAuditLogs } from '@/lib/api/supabase-service';
import { PortalLayout } from '@/components/shell/PortalLayout';
import { AuditLogView } from '@/components/audit/AuditLogView';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

export default function AuditLogsPage() {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>(user?.role || 'REGISTRAR');
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role) {
      setRole(user.role);
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAuditLogs();
      setLogs(data);
    } catch {
      setError('Unable to load audit activity. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <PortalLayout currentRole={role} onRoleChange={setRole} title="Audit Log">
      {loading ? (
        <LoadingSkeleton />
      ) : (
        <AuditLogView
          logs={logs}
          currentRole={role}
          onRefresh={loadData}
          error={error}
        />
      )}
    </PortalLayout>
  );
}
