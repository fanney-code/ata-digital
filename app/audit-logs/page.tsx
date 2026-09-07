'use client';

import React, { useState, useEffect } from 'react';
import { UserRole, AuditLog } from '@/lib/types';
import { useAuth } from '@/lib/context/AuthContext';
import { fetchAuditLogs } from '@/lib/api/supabase-service';
import { PortalLayout } from '@/components/shell/PortalLayout';
import { AuditGovernanceView } from '@/components/admin/AuditGovernanceView';
import { UniversalAuditGovernanceView } from '@/components/admin/UniversalAuditGovernanceView';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

export default function AuditLogsPage() {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>(user?.role || 'REGISTRAR');
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role) {
      setRole(user.role);
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchAuditLogs();
      setLogs(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <PortalLayout
      currentRole={role}
      onRoleChange={setRole}
      title={
        role === 'UNIVERSAL'
          ? 'System Audit & Governance Logs'
          : 'Audit & Governance Logs'
      }
    >
      {loading ? (
        <LoadingSkeleton />
      ) : role === 'UNIVERSAL' ? (
        <UniversalAuditGovernanceView
          logs={logs}
          currentRole={role}
          onRefresh={loadData}
        />
      ) : (
        <AuditGovernanceView
          logs={logs}
          currentRole={role}
          onRefresh={loadData}
        />
      )}
    </PortalLayout>
  );
}
