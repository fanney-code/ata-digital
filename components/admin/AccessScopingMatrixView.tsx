import React, { useState } from 'react';
import { UserAccessScope, UserRole } from '@/lib/types';
import { Building2, ShieldCheck, Users, CheckSquare, Square, ArrowLeft, Check, Lock } from 'lucide-react';

interface AccessScopingMatrixViewProps {
  onBack?: () => void;
}

export const AccessScopingMatrixView: React.FC<AccessScopingMatrixViewProps> = ({ onBack }) => {
  const [scopes, setScopes] = useState<UserAccessScope[]>([
    {
      userId: 'usr-1',
      userName: 'Registrar Alpha',
      userEmail: 'registrar.alpha@institution.edu',
      role: 'REGISTRAR',
      assignedInstitutions: ['inst-1', 'inst-2'],
      assignedDepartments: ['dept-cs', 'dept-ee'],
      assignedPrograms: ['prog-bsc-cs', 'prog-msc-se'],
    },
    {
      userId: 'usr-2',
      userName: 'Admin Beta',
      userEmail: 'admin.beta@institution.edu',
      role: 'ADMINISTRATOR',
      assignedInstitutions: ['inst-1', 'inst-2', 'inst-3'],
      assignedDepartments: ['dept-cs', 'dept-ee', 'dept-ba'],
      assignedPrograms: ['prog-bsc-cs', 'prog-msc-se', 'prog-bba'],
    },
  ]);

  const institutionsList = [
    { id: 'inst-1', name: 'Institute of Technology & Engineering', code: 'ITE' },
    { id: 'inst-2', name: 'Faculty of Theological Studies', code: 'FTS' },
    { id: 'inst-3', name: 'College of Arts & Humanities', code: 'CAH' },
  ];

  const handleToggleInstitution = (userId: string, instId: string) => {
    setScopes((prev) =>
      prev.map((s) => {
        if (s.userId !== userId) return s;
        const exists = s.assignedInstitutions.includes(instId);
        const updatedInsts = exists
          ? s.assignedInstitutions.filter((i) => i !== instId)
          : [...s.assignedInstitutions, instId];
        return { ...s, assignedInstitutions: updatedInsts };
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 mr-1"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div className="p-2 rounded-xl bg-purple-600 text-white shadow-xs">
              <Building2 className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Institution & Access Scoping Matrix
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 font-mono text-xs font-bold border border-purple-200">
              Role Scoping Matrix
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1.5 max-w-2xl">
            Assign user access permissions to scope operational visibility across specific institutions, departments, and programs.
          </p>
        </div>
      </div>

      {/* Scoping Matrix Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
            <tr>
              <th className="p-4">User Details & Role</th>
              {institutionsList.map((inst) => (
                <th key={inst.id} className="p-4 text-center">
                  <div>{inst.name}</div>
                  <span className="font-mono text-[10px] text-slate-400">({inst.code})</span>
                </th>
              ))}
              <th className="p-4 text-right">Access Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {scopes.map((scope) => (
              <tr key={scope.userId} className="hover:bg-slate-50/80 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-slate-100 text-slate-600 font-bold">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{scope.userName}</h4>
                      <p className="text-[11px] text-slate-500 font-mono">{scope.userEmail}</p>
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[9px] border border-blue-200 mt-1 inline-block">
                        {scope.role}
                      </span>
                    </div>
                  </div>
                </td>

                {institutionsList.map((inst) => {
                  const isAssigned = scope.assignedInstitutions.includes(inst.id);
                  return (
                    <td key={inst.id} className="p-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleInstitution(scope.userId, inst.id)}
                        className={`p-2 rounded-xl border transition-all inline-flex items-center justify-center ${
                          isAssigned
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold'
                            : 'bg-slate-50 text-slate-300 border-slate-200 hover:text-slate-400'
                        }`}
                      >
                        {isAssigned ? (
                          <Check className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Lock className="h-4 w-4 text-slate-300" />
                        )}
                      </button>
                    </td>
                  );
                })}

                <td className="p-4 text-right font-mono font-bold text-slate-700">
                  {scope.assignedInstitutions.length} Institutions Assigned
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
