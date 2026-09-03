import React, { useState } from 'react';
import { DashboardMetrics, Registration } from '@/lib/types';
import { MetricCard } from './MetricCard';
import { AttentionRequiredList } from './AttentionRequiredList';
import { WorkflowDistribution } from './WorkflowDistribution';
import { RegistrationTypeDistribution } from './RegistrationTypeDistribution';
import { InstitutionDistribution } from './InstitutionDistribution';
import { CreateRegistrarModal } from '../admin/CreateRegistrarModal';
import { GraduationCap, FileText, CheckCircle2, Archive, UserPlus } from 'lucide-react';

interface AdministratorDashboardProps {
  metrics: DashboardMetrics;
  registrations: Registration[];
  onSelectRegistration: (reg: Registration) => void;
  onViewAllRegistrations?: () => void;
}

export const AdministratorDashboard: React.FC<AdministratorDashboardProps> = ({
  metrics,
  registrations,
  onSelectRegistration,
  onViewAllRegistrations,
}) => {
  const [isRegistrarModalOpen, setIsRegistrarModalOpen] = useState(false);

  const departmentSummary = [
    { name: 'Academic Affairs', count: 5200 },
    { name: 'Student Services', count: 4100 },
    { name: 'Faculty of Science', count: 3100 },
  ];

  const programSummary = [
    { name: 'B.Sc. Computer Science', count: 2100 },
    { name: 'M.A. History', count: 1800 },
    { name: 'B.B.A. Marketing', count: 1500 },
  ];

  const durationExceptions = registrations.filter(
    (r) => r.duration_status && r.duration_status !== 'NORMAL'
  );

  return (
    <div className="space-y-6">
      {/* Admin Action Header */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-blue-50/70 border border-blue-100">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-800">
            Administrative Control Panel
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Define official Registrar accounts and oversee system-wide registration requests.
          </p>
        </div>
        <button
          onClick={() => setIsRegistrarModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          + Define New Registrar
        </button>
      </div>

      {/* Top 4 Metrics */}
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

      {/* Main Grid (Left Column: Attention Required & Exceptions, Right Column: Analytics Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Wide) */}
        <div className="lg:col-span-2 space-y-6">
          <AttentionRequiredList
            registrations={registrations}
            onSelectRegistration={onSelectRegistration}
            onViewAll={onViewAllRegistrations}
          />

          {/* Duration Exceptions & Alerts Widget */}
          {durationExceptions.length > 0 && (
            <div className="bg-white border border-amber-200/90 rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-amber-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">
                      Course Duration Exceptions ({durationExceptions.length})
                    </h3>
                    <p className="text-[10px] text-slate-500">
                      Candidates exceeding expected program completion timeline
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                  Attention Required
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {durationExceptions.slice(0, 5).map((reg) => (
                  <div
                    key={reg.id}
                    onClick={() => onSelectRegistration(reg)}
                    className="py-2.5 flex items-center justify-between hover:bg-slate-50/80 p-2 rounded-lg cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">{reg.registration_number}</span>
                        <span className="text-xs font-semibold text-slate-800">{reg.student ? `${reg.student.first_name} ${reg.student.last_name}` : 'Student'}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {reg.institution?.name || 'Institution'} • Cycle <span className="font-mono font-semibold text-slate-700">{reg.academic_year}</span>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-bold font-sans text-[10px] border border-amber-200 shrink-0">
                      {reg.duration_status?.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column Stack */}
        <div className="space-y-6">
          <WorkflowDistribution distribution={metrics.workflowDistribution} variant="bars" />
          
          <RegistrationTypeDistribution distribution={metrics.registrationTypesDistribution} />
          
          <InstitutionDistribution distribution={metrics.institutionDistribution} />

          {/* Departments Summary Card */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-4">
              Departments
            </h3>
            <div className="space-y-3">
              {departmentSummary.map((d) => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">{d.name}</span>
                  <span className="font-mono font-bold text-slate-900">{d.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Programs Summary Card */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-4">
              Programs
            </h3>
            <div className="space-y-3">
              {programSummary.map((p) => (
                <div key={p.name} className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">{p.name}</span>
                  <span className="font-mono font-bold text-slate-900">{p.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Create Registrar Modal */}
      <CreateRegistrarModal
        isOpen={isRegistrarModalOpen}
        onClose={() => setIsRegistrarModalOpen(false)}
      />
    </div>
  );
};
