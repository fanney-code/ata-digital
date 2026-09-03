import React from 'react';
import { DashboardMetrics, Registration } from '@/lib/types';
import { MetricCard } from './MetricCard';
import { RegistrationTaskList } from './RegistrationTaskList';
import { WorkflowDistribution } from './WorkflowDistribution';
import { RegistrationTypeDistribution } from './RegistrationTypeDistribution';
import { AcademicYearDistribution } from './AcademicYearDistribution';
import { OrgHierarchyDistribution } from './OrgHierarchyDistribution';
import { GraduationCap, FileText, CheckCircle2, Archive } from 'lucide-react';

interface RegistrarDashboardProps {
  metrics: DashboardMetrics;
  registrations: Registration[];
  onNewRegistration: () => void;
  onSelectRegistration: (reg: Registration) => void;
  onViewAllRegistrations?: () => void;
}

export const RegistrarDashboard: React.FC<RegistrarDashboardProps> = ({
  metrics,
  registrations,
  onSelectRegistration,
  onViewAllRegistrations,
}) => {
  return (
    <div className="space-y-6">
      {/* Overview subtitle banner */}
      <div className="-mt-2 mb-2">
        <p className="text-xs text-slate-500 font-medium">
          Overview of current registration workflows and pending actions.
        </p>
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

      {/* Primary Section: Registrar Tasks */}
      <RegistrationTaskList
        registrations={registrations}
        onSelectRegistration={onSelectRegistration}
        onViewAll={onViewAllRegistrations}
      />

      {/* Bottom 2x2 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WorkflowDistribution distribution={metrics.workflowDistribution} variant="bars" />
        <RegistrationTypeDistribution distribution={metrics.registrationTypesDistribution} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AcademicYearDistribution distribution={metrics.academicYearDistribution} />
        <OrgHierarchyDistribution
          institutionsCount={metrics.institutionDistribution.length || 12}
          departmentsCount={48}
          programsCount={156}
        />
      </div>
    </div>
  );
};
