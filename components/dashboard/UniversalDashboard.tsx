import React, { useState } from 'react';
import { DashboardMetrics, Registration } from '@/lib/types';
import { exportRegistrationsToExcel } from '@/lib/api/supabase-service';
import { MetricCard } from './MetricCard';
import { WorkflowDistribution } from './WorkflowDistribution';
import { RegistrationTypeDistribution } from './RegistrationTypeDistribution';
import { AcademicYearDistribution } from './AcademicYearDistribution';
import { InstitutionDistribution } from './InstitutionDistribution';
import { GraduationCap, FileText, CheckCircle2, Archive, Download, FileSpreadsheet } from 'lucide-react';

interface UniversalDashboardProps {
  metrics: DashboardMetrics;
  registrations: Registration[];
  onSelectRegistration: (reg: Registration) => void;
}

export const UniversalDashboard: React.FC<UniversalDashboardProps> = ({
  metrics,
  registrations,
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportRegistrationsToExcel(registrations);
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Export Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">
            System-Wide Operations & Analytics Dashboard
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cross-institutional data aggregation & universal reporting controls
          </p>
        </div>

        <button
          type="button"
          onClick={handleExport}
          disabled={isExporting || registrations.length === 0}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-40 shrink-0"
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>{isExporting ? 'Generating Report...' : `Export ${registrations.length} Registrations to Excel`}</span>
        </button>
      </div>

      {/* Top Level 4 Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Students"
          value={metrics.totalStudents}
          icon={GraduationCap}
        />
        <MetricCard
          title="Total Registrations"
          value={metrics.totalRegistrations}
          icon={FileText}
        />
        <MetricCard
          title="Approved Registrations"
          value={metrics.approvedRegistrations}
          icon={CheckCircle2}
        />
        <MetricCard
          title="Archived Registrations"
          value={metrics.archivedRegistrations}
          icon={Archive}
        />
      </div>

      {/* Middle Row Grid (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WorkflowDistribution distribution={metrics.workflowDistribution} variant="list" />
        <RegistrationTypeDistribution distribution={metrics.registrationTypesDistribution} />
      </div>

      {/* Bottom Row Grid (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AcademicYearDistribution distribution={metrics.academicYearDistribution} />
        <InstitutionDistribution distribution={metrics.institutionDistribution} />
      </div>
    </div>
  );
};
