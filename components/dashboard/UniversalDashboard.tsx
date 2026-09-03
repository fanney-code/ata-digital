import React from 'react';
import { DashboardMetrics, Registration } from '@/lib/types';
import { MetricCard } from './MetricCard';
import { WorkflowDistribution } from './WorkflowDistribution';
import { RegistrationTypeDistribution } from './RegistrationTypeDistribution';
import { AcademicYearDistribution } from './AcademicYearDistribution';
import { InstitutionDistribution } from './InstitutionDistribution';
import { GraduationCap, FileText, CheckCircle2, Archive } from 'lucide-react';

interface UniversalDashboardProps {
  metrics: DashboardMetrics;
  registrations: Registration[];
  onSelectRegistration: (reg: Registration) => void;
}

export const UniversalDashboard: React.FC<UniversalDashboardProps> = ({
  metrics,
}) => {
  return (
    <div className="space-y-6">
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
