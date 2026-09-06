'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole, Student } from '@/lib/types';
import { useAuth } from '@/lib/context/AuthContext';
import { fetchStudents, deleteStudent, deleteStudentsBulk } from '@/lib/api/supabase-service';
import { PortalLayout } from '@/components/shell/PortalLayout';
import { StudentTimelineHistoryView } from '@/components/registration/StudentTimelineHistoryView';
import {
  Users,
  Search,
  Mail,
  Phone,
  ArrowRight,
  History,
  CheckSquare,
  Square,
  Trash2,
  AlertTriangle,
  X,
} from 'lucide-react';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

export default function StudentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>(user?.role || 'REGISTRAR');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role) {
      setRole(user.role);
    }
  }, [user]);
  const [query, setQuery] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Multi-Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [isConfirmBulkOpen, setIsConfirmBulkOpen] = useState(false);
  const [isConfirmDeleteAllOpen, setIsConfirmDeleteAllOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchStudents(query);
      setStudents(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [query]);

  // Check URL params for direct student selection or query
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const studentId = params.get('id');
      if (studentId) {
        setSelectedStudentId(studentId);
      }
      const q = params.get('query');
      if (q) {
        setQuery(q);
      }
    }
  }, []);

  const isAllSelected = students.length > 0 && students.every((s) => selectedIds.includes(s.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(students.map((s) => s.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Single Delete
  const handleConfirmSingleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteStudent(deleteTarget.id);
      setSelectedIds((prev) => prev.filter((i) => i !== deleteTarget.id));
      setDeleteTarget(null);
      await loadData();
    } catch (err: any) {
      alert(`Failed to delete student: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Bulk Delete Selected
  const handleConfirmBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsDeleting(true);
    try {
      await deleteStudentsBulk(selectedIds);
      setSelectedIds([]);
      setIsConfirmBulkOpen(false);
      await loadData();
    } catch (err: any) {
      alert(`Failed to delete selected candidates: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Delete All Students
  const handleConfirmDeleteAll = async () => {
    if (students.length === 0) return;
    setIsDeleting(true);
    try {
      const allIds = students.map((s) => s.id);
      await deleteStudentsBulk(allIds);
      setSelectedIds([]);
      setIsConfirmDeleteAllOpen(false);
      await loadData();
    } catch (err: any) {
      alert(`Failed to delete all candidates: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <PortalLayout
      currentRole={role}
      onRoleChange={setRole}
      title={selectedStudentId ? "Student Lifetime History Timeline" : "Student Directory"}
    >
      {selectedStudentId ? (
        <StudentTimelineHistoryView
          studentIdOrUid={selectedStudentId}
          currentRole={role}
          onBack={() => setSelectedStudentId(null)}
        />
      ) : (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Student Directory
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Centralized registry of verified student candidates ({students.length} Total Records)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-72">
                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search UID, Name, Email..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              {students.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsConfirmDeleteAllOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors shrink-0"
                >
                  <Trash2 className="h-4 w-4 text-rose-600" />
                  <span>Delete All ({students.length})</span>
                </button>
              )}
            </div>
          </div>

          {/* Toolbar: Select All Checkbox Button */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handleToggleSelectAll}
              disabled={students.length === 0}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shrink-0 disabled:opacity-50 shadow-2xs"
            >
              {isAllSelected ? (
                <CheckSquare className="h-4 w-4 text-blue-600" />
              ) : (
                <Square className="h-4 w-4 text-slate-400" />
              )}
              <span>Select All Candidates ({students.length})</span>
            </button>

            <span className="text-xs text-slate-400 font-medium">
              {selectedIds.length} candidate{selectedIds.length !== 1 ? 's' : ''} checked
            </span>
          </div>

          {/* Floating Bulk Action Bar */}
          {selectedIds.length > 0 && (
            <div className="p-3.5 bg-slate-900 text-white rounded-2xl shadow-lg flex items-center justify-between gap-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono text-xs font-bold border border-blue-400/30">
                  {selectedIds.length} Selected
                </span>
                <span className="text-xs text-slate-300">
                  Perform bulk actions on checked student profiles
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedIds([])}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Deselect All
                </button>
                <button
                  onClick={() => setIsConfirmBulkOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Selected ({selectedIds.length})</span>
                </button>
              </div>
            </div>
          )}

          {/* Grid Directory List */}
          {loading ? (
            <LoadingSkeleton />
          ) : students.length === 0 ? (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl">
              <Users className="mx-auto h-8 w-8 text-slate-300 mb-2" />
              <h4 className="text-xs font-bold text-slate-800">No Student Records Found</h4>
              <p className="text-[11px] text-slate-400 mt-1">
                Try adjusting your search criteria or register a student using the manual wizard or Excel import.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {students.map((st) => {
                const isSelected = selectedIds.includes(st.id);

                return (
                  <div
                    key={st.id}
                    className={`p-5 rounded-2xl border transition-all shadow-xs space-y-3 relative group ${
                      isSelected
                        ? 'bg-blue-50/50 border-blue-300 ring-2 ring-blue-500/20'
                        : 'bg-white border-slate-200/90 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        {/* Specific Selection Checkbox */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleSelect(st.id);
                          }}
                          className="mt-0.5 text-slate-400 hover:text-blue-600 transition-colors shrink-0"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>

                        <div>
                          <span className="text-[10px] font-mono font-bold text-blue-600">
                            {st.permanent_uid}
                          </span>
                          <h3
                            onClick={() => setSelectedStudentId(st.id)}
                            className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors cursor-pointer"
                          >
                            {st.first_name} {st.last_name}
                          </h3>
                        </div>
                      </div>

                      {/* Single Specific Delete Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(st);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete candidate profile"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        <span>{st.email}</span>
                      </div>
                      {st.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          <span>{st.phone}</span>
                        </div>
                      )}
                    </div>

                    <div
                      onClick={() => setSelectedStudentId(st.id)}
                      className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600 cursor-pointer"
                    >
                      <span className="flex items-center gap-1">
                        <History className="h-3.5 w-3.5" />
                        View Lifetime History
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Single Delete Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-sm font-bold text-slate-900">Delete Candidate Profile</h3>
            </div>
            <p className="text-xs text-slate-600">
              Are you sure you want to delete <strong className="text-slate-900">{deleteTarget.first_name} {deleteTarget.last_name}</strong> ({deleteTarget.permanent_uid})? This will also remove any linked registration records.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmSingleDelete}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs disabled:opacity-40"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Selected Modal */}
      {isConfirmBulkOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-sm font-bold text-slate-900">Delete Selected Candidates</h3>
            </div>
            <p className="text-xs text-slate-600">
              Are you sure you want to permanently delete <strong className="text-rose-600">{selectedIds.length} checked student candidates</strong> and their registrations?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmBulkOpen(false)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmBulkDelete}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs disabled:opacity-40"
              >
                {isDeleting ? 'Deleting Selected...' : `Delete ${selectedIds.length} Students`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Modal */}
      {isConfirmDeleteAllOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-base font-bold text-slate-900">Delete All Candidates</h3>
            </div>
            <p className="text-xs text-slate-600">
              <strong className="text-rose-600">WARNING:</strong> This action will delete ALL <strong className="text-slate-900">{students.length} candidate student profiles</strong> and their registrations from the database.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmDeleteAllOpen(false)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDeleteAll}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs disabled:opacity-40"
              >
                {isDeleting ? 'Purging All...' : `Confirm Delete All (${students.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  );
}
