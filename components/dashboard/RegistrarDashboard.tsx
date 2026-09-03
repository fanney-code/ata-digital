import React from 'react';
import { DashboardMetrics, Registration } from '@/lib/types';
import { MetricCard } from './MetricCard';
import { RegistrationTaskList } from './RegistrationTaskList';
import { WorkflowDistribution } from './WorkflowDistribution';
import { RegistrationTypeDistribution } from './RegistrationTypeDistribution';
import { AcademicYearDistribution } from './AcademicYearDistribution';
import { OrgHierarchyDistribution } from './OrgHierarchyDistribution';
import { GraduationCap, FileText, CheckCircle2, Archive, AlertCircle, ArrowRight } from 'lucide-react';

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
  const correctionRequiredRegs = registrations.filter(
    (r) => r.status === 'CORRECTION_REQUIRED'
  );

  return (
    <div className="space-y-6">
      {/* Overview subtitle banner */}
      <div className="-mt-2 mb-2">
        <p className="text-xs text-slate-500 font-medium">
          Overview of current registration workflows and pending actions.
        </p>
      </div>

      {/* Correction Required Return Alert Banner */}
      {correctionRequiredRegs.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-600 text-white shadow-xs">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rose-950">
                  {correctionRequiredRegs.length} Registrations Returned for Correction
                </h3>
                <p className="text-xs text-rose-700">
                  Administrator requested document changes or info updates before approval.
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-rose-200 text-rose-900 font-bold text-xs border border-rose-300">
              High Priority Alert
            </span>
          </div>

          <div className="divide-y divide-rose-200/60 pt-1">
            {correctionRequiredRegs.map((reg) => (
              <div
                key={reg.id}
                onClick={() => onSelectRegistration(reg)}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-rose-100/50 p-2 rounded-xl cursor-pointer transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900">{reg.registration_number}</span>
                    <span className="text-xs font-bold text-slate-900">{reg.student ? `${reg.student.first_name} ${reg.student.last_name}` : 'Student'}</span>
                  </div>
                  {reg.rejection_reason && (
                    <p className="text-xs text-rose-800 font-medium mt-1">
                      Reason: "{reg.rejection_reason}"
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectRegistration(reg);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shrink-0 shadow-xs"
                >
                  <span>Review & Fix</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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
