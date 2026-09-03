'use client';

import React, { useState } from 'react';
import { UserRole } from '@/lib/types';
import { PortalLayout } from '@/components/shell/PortalLayout';
import { FolderOpen, FileText, CheckCircle2 } from 'lucide-react';

export default function DocumentsPage() {
  const [role, setRole] = useState<UserRole>('REGISTRAR');

  const docTemplates = [
    { name: 'Identity Proof Verification Form', category: 'Compliance', size: '1.2 MB', updated: '2026-02-01' },
    { name: 'Previous Academic Transcript Clearance', category: 'Transfers', size: '850 KB', updated: '2026-01-28' },
    { name: 'Institution Transfer Agreement', category: 'Inter-Departmental', size: '2.4 MB', updated: '2026-02-10' },
    { name: 'Student Code of Conduct Acknowledgment', category: 'General', size: '540 KB', updated: '2026-01-15' },
  ];

  return (
    <PortalLayout
      currentRole={role}
      onRoleChange={setRole}
      title="Documents & Templates"
    >
      <div className="space-y-6">
        <div className="flex items-center gap-3 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <FolderOpen className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Registration Document Library
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Standard forms, verification checklists, and template assets
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {docTemplates.map((doc, idx) => (
            <div
              key={idx}
              className="p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-start justify-between"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {doc.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Category: <span className="font-semibold text-slate-700 dark:text-slate-300">{doc.category}</span>
                  </p>
                  <span className="text-[10px] font-mono text-slate-400 block mt-1">
                    Size: {doc.size} | Updated: {doc.updated}
                  </span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="h-3 w-3" />
                Verified
              </span>
            </div>
          ))}
        </div>
      </div>
    </PortalLayout>
  );
}
