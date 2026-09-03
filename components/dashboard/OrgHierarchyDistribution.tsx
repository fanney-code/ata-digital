import React from 'react';
import { Building2, Layers, BookOpen } from 'lucide-react';

interface OrgHierarchyDistributionProps {
  institutionsCount?: number;
  departmentsCount?: number;
  programsCount?: number;
}

export const OrgHierarchyDistribution: React.FC<OrgHierarchyDistributionProps> = ({
  institutionsCount = 3,
  departmentsCount = 4,
  programsCount = 5,
}) => {
  const items = [
    { name: 'Institutions', count: institutionsCount, icon: Building2 },
    { name: 'Departments', count: departmentsCount, icon: Layers },
    { name: 'Programs', count: programsCount, icon: BookOpen },
  ];

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs">
      <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-4">
        Org Hierarchy Distribution
      </h3>

      <div className="space-y-2.5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.name}
              className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/60"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 shadow-2xs">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold text-slate-700">{item.name}</span>
              </div>
              <span className="font-mono font-bold text-slate-900 text-sm">{item.count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
